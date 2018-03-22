var File = Java.type("java.io.File")
var Files = Java.type("java.nio.file.Files")
var Paths = Java.type("java.nio.file.Paths")
var URL = Java.type("java.net.URL")
var Channels = Java.type("java.nio.channels.Channels")
var FileOutputStream = Java.type("java.io.FileOutputStream")
var Long = Java.type("java.lang.Long")
var FilenameFilter = Java.type("java.io.FilenameFilter")
var FileUtils = Java.type("org.apache.commons.io.FileUtils")

var repoDownloder = require('/util/repoDownloader')
var Utils = require("/util/util")

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
		installBitcodes(installDir, bitcodesToInstall)
	}
	
	if (jarsToInstall) {
		installJarDependencies(installDir, jarsToInstall)
	}
	
	if (resource) {
		var depsArr;
		
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

		if (bitcodesToInstall && depsArr.length) {
			var bitcodeInfo = parseBitcodeInfo(resource);

			for (var i = 0; i < depsArr.length; i++) {
				var depInfo = parseBitcodeInfo(depsArr[i]);
				
				if (depInfo.name == bitcodeInfo.name) {
					depsArr.splice(i, 1);
					break;
				}
			}
		}

		if (depsArr.indexOf(resource) < 0) {
			depsArr.push(resource)

			FileUtils.write(briefJsonFile, JSON.stringify(briefJson, null, 2));
		}
	}
}

function parseBitcodeInfo(name) {
	var owner, repository, version;

	if (name.indexOf('@') > -1) {
		var versionIndex = name.indexOf('@');

		version = name.substring(versionIndex + 1);
		name = name.substring(0, versionIndex);
	}

	if (name.indexOf('/') == -1) {
		owner = DEF_BITCODES_OWNER;
		repository = name;
		name = owner + '/' + repository;
	} else {
		var splitted = name.split('/');
		owner = splitted[0];
		repository = splitted[1];
	}

	return {
		name: name,
		owner: owner, 
		repository: repository,
		version: version
	}
}

function installBitcodes(installDir, bitcodesToInstall) {
	bitcodesToInstall.forEach(function(bitcode) {
		var bitcodeInfo = parseBitcodeInfo(bitcode);
		
		log("Installing bitcode: " + bitcodeInfo.name + "...")
		
		var libBitcodeDir = Paths.get(installDir, LIB_PATH_BITCODE, bitcodeInfo.owner, bitcodeInfo.repository).toFile();

		var tempDir;
		var cachedBitcode;
		var libBriefJson;

		if (bitcodeInfo.version) {
			cachedBitcode = findBitcodeInLocalCache(bitcodeInfo.owner, bitcodeInfo.repository, bitcodeInfo.version);

			if (cachedBitcode) {
				copyBitcodeFromCache(cachedBitcode, libBitcodeDir);
				
				var briefJsonFile = new File(libBitcodeDir, "brief.json")
				libBriefJson = Utils.readJson(briefJsonFile);
			}
		}

		if (!cachedBitcode) {
			try {
				tempDir = Files.createTempDirectory(bitcodeInfo.repository + '-install').toFile();
				
				var zipFile = File.createTempFile(bitcodeInfo.name, ".zip", tempDir)
				
				repoDownloder.downloadZip(bitcodeInfo.name, bitcodeInfo.version, zipFile)
				
				var createdFiles = Utils.unzip(zipFile.getPath(), tempDir)
				
				var unzipedDir = new File(tempDir + File.separator + createdFiles[0]);
				
				var briefJsonFile = new File(unzipedDir, "brief.json")
				
				if (!briefJsonFile.exists()) {
					throw new Error("Invalid thrust-seed, 'brief.json' was not found on " + briefJsonFile.getAbsolutePath())
				}
				
				libBriefJson = Utils.readJson(briefJsonFile);
				
				cachedBitcode = findBitcodeInLocalCache(bitcodeInfo.owner, bitcodeInfo.repository, libBriefJson.version)
				
				if (cachedBitcode) {
					copyBitcodeFromCache(cachedBitcode, libBitcodeDir);
				} else {
					log("Not found on cache, downloading...");
					
					var pathToCopy = libBriefJson.path 
					 
					var libCacheFile = Paths.get(LOCAL_REPO_BITCODE, bitcodeInfo.owner, bitcodeInfo.repository, libBriefJson.version).toFile();
					
					if (libCacheFile.exists()) {
						FileUtils.cleanDirectory(libCacheFile);
					} else {
						libCacheFile.mkdirs()
					}
					
					if (!pathToCopy || pathToCopy == '.') { 
						FileUtils.copyDirectory(unzipedDir, libCacheFile)
					} else {
						var fileToCopy = new File(unzipedDir, pathToCopy);
						
						if (fileToCopy.isDirectory()) {
							FileUtils.copyDirectory(fileToCopy, libCacheFile)
						} else {
							FileUtils.copyFile(fileToCopy, new File(libCacheFile, pathToCopy))
						}
						
						FileUtils.copyFile(briefJsonFile, new File(libCacheFile, "brief.json"))
					}
					
					if (libBitcodeDir.exists()) {
						FileUtils.cleanDirectory(libBitcodeDir);
					} else {
						libBitcodeDir.mkdirs()
					}
					
					FileUtils.copyDirectory(libCacheFile, libBitcodeDir)
				}
			} finally {
				if (tempDir) {
					FileUtils.deleteDirectory(tempDir)
				}
			}
		}

		var dependencies = libBriefJson.dependencies
		
		if (dependencies) {
			if (Array.isArray(dependencies)) { //An array deps is only bitcode dependencies
				installBitcodes(installDir, dependencies)
			} else {
				print()
				if (Array.isArray(dependencies.jars)) { //jar dependencies
					installJarDependencies(installDir, dependencies.jars)
				}
				
				if (Array.isArray(dependencies.bitcodes)) { //bitcode dependencies
					installBitcodes(installDir, dependencies.bitcodes)
				}
			}
		}
		
		print("DONE")
	});
}

function copyBitcodeFromCache(cachedBitcode, libBitcodeDir) {
	log("Version " + cachedBitcode.version  + " found on cache...")
				
	if (libBitcodeDir.exists()) {
		FileUtils.cleanDirectory(libBitcodeDir);
	} else {
		libBitcodeDir.mkdirs()
	}

	FileUtils.copyDirectory(cachedBitcode.file, libBitcodeDir);
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
	
	var nMinVersion;
	
	if (minVersion) {
		var bitcodeCache = new File(bitcodesCache, minVersion)
		nMinVersion = versionToNumber(owner, repository, minVersion)
		
		if (bitcodeCache.exists()) {
			return {
				version: minVersion,
				nVersion: nMinVersion,
				file: bitcodeCache
			}
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
			return nMinVersion == undefined || bitCodeInfo.nVersion >= nMinVersion
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