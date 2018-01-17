var File = Java.type("java.io.File")
var Paths = Java.type("java.nio.file.Paths")
var URL = Java.type("java.net.URL")
var Channels = Java.type("java.nio.channels.Channels")
var FileOutputStream = Java.type("java.io.FileOutputStream")
var Long = Java.type("java.lang.Long")
var FilenameFilter = Java.type("java.io.FilenameFilter")
var FileUtils = Java.type("org.apache.commons.io.FileUtils")

var DEF_BITCODES_OWNER = "thrust-bitcodes"
	
var MAVEN_BASE_URL = "http://central.maven.org/maven2/{0}/{1}/{2}/{3}"; //group/name/version/jarName

var LIB_PATH = ".lib"
var LIB_PATH_BITCODE = Paths.get(LIB_PATH, "bitcodes").toString()
var LIB_PAR_JAR = Paths.get(LIB_PATH, "jars").toString()

var LOCAL_REPO = Paths.get(java.lang.System.getProperty("user.home"), ".thrust-cache").toString()
var LOCAL_REPO_BITCODE = Paths.get(LOCAL_REPO, "bitcodes").toString()
var LOCAL_REPO_JAR = Paths.get(LOCAL_REPO, "jars").toString()

function runInstall(runInfo) {
	var installDir
	
	if (runInfo.args.basePath) {
		installDir = new File(runInfo.args.basePath)
	} else {
		installDir = new File("").getAbsolutePath()
	}
	
	var briefJsonFile = new File(installDir, "brief.json")

	if (!briefJsonFile.exists()) {
		throw new Error("This isn't a thrust app, 'brief.json' not found.")
	}
	
	var briefJson = JSON.parse(FileUtils.readFileToString(briefJsonFile))
	
	var client = require("/util/github_client")

	var resource = runInfo.args.resource
	var bitcodesToInstall
	var jarsToInstall
	
	if (resource) { //Install only this resource
		var depParts = resource.split(":")
		
		if (depParts.length == 3) {
			jarsToInstall = [resource] //is a jar
		} else {
			bitcodesToInstall = [resource] //is a bitcode
		}
	} else { //Install all bitcodes based on brief.json
		var dependencies = briefJson.dependencies
		
		if (dependencies) {
			if (Array.isArray(dependencies)) { //An array deps is only bitcode dependencies
				bitcodesToInstall = dependencies
			} else {
				if (Array.isArray(dependencies.bitcodes)) {
					bitcodesToInstall = dependencies.bitcodes
				}
				
				if (Array.isArray(dependencies.jars)) {
					jarsToInstall = dependencies.jars
				}
			}
		}
		
		if ((!bitcodesToInstall || (bitcodesToInstall.length || 0) == 0) && (!jarsToInstall || (jarsToInstall.length || 0) == 0)) {
			throw new Error('No dependencies was found to install.')
		}
	}
	
	if (bitcodesToInstall) {
		installBitcodes(installDir, client, bitcodesToInstall)
	}
	
	if (jarsToInstall) {
		installJarDependencies(installDir, jarsToInstall)
	}
	
	if (resource) {
		var depsArr
		
		if (jarsToInstall) {
			depsArr = briefJson.dependencies
			
			if (!depsArr || Array.isArray(depsArr)) {
				briefJson.dependencies = {
					bitcodes: depsArr || [],
					jars: []
				}
				
				depsArr = briefJson.dependencies.jars;
			} else if (depsArr) {
				depsArr = depsArr.jars
			}
			
			if (!depsArr) {
				depsArr = briefJson.dependencies.jars = []
			}
		} else {
			depsArr = briefJson.dependencies
			
			if (depsArr && !Array.isArray(depsArr) && depsArr.bitcodes) {
				depsArr = depsArr.bitcodes;
			}
			
			if (!Array.isArray(depsArr)) {
				depsArr = briefJson.dependencies = []
			}
		}
		
		if (depsArr.indexOf(resource) < 0) {
			depsArr.push(resource)

			FileUtils.write(briefJsonFile, JSON.stringify(briefJson, null, 2));
		}
	}
}

function installBitcodes(installDir, client, bitcodesToInstall) {
	bitcodesToInstall.forEach(function(bitcode) {
		var owner
		var repository

		if (bitcode.indexOf('/') > -1) {
			var t = bitcode.split('/')
			owner = t[0]
			repository = t[1]

			if (!owner) {
				throw new Error("Invalid owner on bitcode: " + bitcode + "\nMust be 'owner/bitcode' or just 'bitcode' in case of a default repository.")
			}

			if (!repository) {
				throw new Error("Invalid repository on bitcode: " + bitcode + "\nMust be 'owner/bitcode' or just 'bitcode' in case of a default repository.")
			}
		} else {
			repository = bitcode
		}

		if (!owner) {
			owner = DEF_BITCODES_OWNER
		}
		
		var bitCodeIdentifier = owner + "/" + repository;

		log("Installing bitcode: " + bitCodeIdentifier + "...")

		var libBriefJson = client.getBriefJson(owner, repository)

		if (!libBriefJson) {
			throw new Error("Invalid bitcode, 'brief.json' was not found on " + bitCodeIdentifier)
		}
		
		var libBitcodeDir = Paths.get(installDir, LIB_PATH_BITCODE, owner, repository).toFile()

		//Installing bitcode
		var cachedBitcode = findBitcodeInLocalCache(owner, repository, libBriefJson.version)
		
		if (cachedBitcode) {
			log("Version " + cachedBitcode.version  + " found on cache...")

			FileUtils.copyDirectory(cachedBitcode.file, libBitcodeDir)
		} else {
			log("Not found on cache, downloading...")
			
			if (!libBitcodeDir.exists()) {
				libBitcodeDir.mkdirs()
			}
			
			var pathToDownload = libBriefJson.path
			
			if (!pathToDownload || pathToDownload == '.') {
				pathToDownload = ''
			}
			
			client.downloadFiles(owner, repository, pathToDownload, libBitcodeDir)
			
			FileUtils.copyDirectory(libBitcodeDir, Paths.get(LOCAL_REPO_BITCODE, owner, repository, libBriefJson.version).toFile())
		}
		
		var dependencies = libBriefJson.dependencies
		
		if (!dependencies) {
			print("DONE")
		} else {
			if (Array.isArray(dependencies)) { //An array deps is only bitcode dependencies
				print("DONE")
				
				installBitcodes(installDir, client, dependencies)
			} else {
				if (Array.isArray(dependencies.jars)) { //jar dependencies
					installJarDependencies(installDir, dependencies.jars)
				}
				
				print("DONE")
				
				if (Array.isArray(dependencies.bitcodes)) { //bitcode dependencies
					installBitcodes(installDir, client, dependencies.bitcodes)
				}
			}
		}
	});
}

function installJarDependencies(installDir, jarDeps) {
	jarDeps.forEach(function(jarDep) {
		var depParts = jarDep.split(":")
		
		if (depParts.length != 3) {
			throw new Error("Failed to install a jar dependency. A dependency must be on this form: 'group:name:version'. [" + jarDep + "]");
		}
		
		var group = depParts[0]
		var artifact = depParts[1]
		var version = depParts[2]
		var jarName = artifact.concat("-").concat(version).concat(".jar")
		
		var libJarFile = Paths.get(installDir, LIB_PAR_JAR, jarName).toFile()
		
		log("Installing jar: " + jarName + "...")
		
		if (libJarFile.exists()) {
			print("jar is already installed")
			return
		}
		
		var jarCache = Paths.get(LOCAL_REPO_JAR, group, jarName).toFile()
		
		if (!jarCache.exists()) { //not found on cache
			log("Not found on cache, downloading...")
			
			var url = new URL(formatString(MAVEN_BASE_URL, group.replace(/\./g, "/"), artifact, version, jarName))
			FileUtils.copyURLToFile(url, jarCache);
		} else {
			log("Version " + version  + " found on cache...")
		}

		FileUtils.copyFile(jarCache, libJarFile)
		
		print("DONE")
	})
}

function formatString(format) {
	var args = Array.prototype.slice.call(arguments, 1);
    
	return format.replace(/{(\d+)}/g, function(match, number) { 
      return typeof args[number] != 'undefined' ? args[number] : match
    })
}

function findBitcodeInLocalCache(owner, repository, minVersion) {
	var bitcodesCache = Paths.get(LOCAL_REPO_BITCODE, owner, repository).toFile()
	var bitcodeCache = new File(bitcodesCache, minVersion)
	
	var nMinVersion = versionToNumber(owner, repository, minVersion)
	
	if (bitcodeCache.exists()) {
		return {
			version: minVersion,
			nVersion: nMinVersion,
			file: bitcodeCache
		}
	}
	
	var files = bitcodesCache.listFiles()
	
	if (files) {
		return Java.from(files).map(function(bitcodeFile) {
			return {
				version: bitcodeFile.getName(),
				nVersion: versionToNumber(owner, repository, bitcodeFile.getName()),
				file: bitcodeFile
			}
		}).filter(function(bitCodeInfo) {
			return bitCodeInfo.nVersion >= nMinVersion
		}).sort(function(info1, info2) {
			return info1.nVersion - info2.nVersion
		}).pop()
	}
}

function versionToNumber(owner, repository, version) {
	var nVersion = Number(version.replace(/\./g, '')) 
	
	if (isNaN(nVersion)) {
		throw new Error("[ERROR] Invalid version '" + version + "' on bitcode: " + owner + "/" + repository);
	}
	
	return nVersion;
}

exports = {
	run : runInstall
}