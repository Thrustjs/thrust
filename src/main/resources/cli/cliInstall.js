var File = Java.type("java.io.File")
var Paths = Java.type("java.nio.file.Paths")
var URL = Java.type("java.net.URL")
var Channels = Java.type("java.nio.channels.Channels")
var FileOutputStream = Java.type("java.io.FileOutputStream")
var Long = Java.type("java.lang.Long")
var FilenameFilter = Java.type("java.io.FilenameFilter")
var FileUtils = Java.type("org.apache.commons.io.FileUtils")

var DEF_BITCODES_OWNER = "thrust-bitcodes"
var DEF_LIB_PATH = "lib"

var BITCODE_LOCAL_REPO = Paths.get(java.lang.System.getProperty("user.home"), ".thrust-cache", "bitcodes").toString()

function runInstall(runInfo) {
	var installDir
	
	if (runInfo.args.basePath) {
		installDir = new File(runInfo.args.basePath)
	} else {
		installDir = new File(".").getAbsolutePath()
	}
	
	var briefJsonFile = new File(installDir, "brief.json")

	if (!briefJsonFile.exists()) {
		throw new Error("This isn't a thrust app, 'brief.json' not found.")
	}
	
	var briefJson = JSON.parse(FileUtils.readFileToString(briefJsonFile))
	
	var client = require("/util/github_client")

	var bitcode = runInfo.args.bitcode
	var bitcodesToInstall
	
	if (bitcode) { //Install only this bitcode
		bitcodesToInstall = [bitcode]
	} else { //Install all bitcodes based on brief.json
		bitcodesToInstall = briefJson.dependencies
	}
	
	if (!bitcodesToInstall || bitcodesToInstall.length == 0) {
		throw new Error('No dependencies was found to install.')
	}
	
	installBitcodes(installDir, client, bitcodesToInstall)
	
	if (bitcode) {
		if (!briefJson.dependencies) {
			briefJson.dependencies = []
		}
		
		if (briefJson.dependencies.indexOf(bitcode) < 0) {
			briefJson.dependencies.push(bitcode)

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
		
		var libDir = Paths.get(installDir, DEF_LIB_PATH, owner, repository).toFile()
		
		var cachedBitcode = findInLocalCache(owner, repository, libBriefJson.version)
		
		if (cachedBitcode) {
			log("Found version " + cachedBitcode.version  + " on cache...")

			FileUtils.copyDirectory(cachedBitcode.file, libDir)
		} else {
			log("Not found on cache, downloading...")
			
			if (!libDir.exists()) {
				libDir.mkdirs()
			}
			
			var pathToDownload = libBriefJson.path
			
			if (!pathToDownload || pathToDownload == '.') {
				pathToDownload = ''
			}
			
			client.downloadFiles(owner, repository, pathToDownload, libDir)
			
			FileUtils.copyDirectory(libDir, Paths.get(BITCODE_LOCAL_REPO, owner, repository, libBriefJson.version).toFile())
		}
		
		print("DONE")
		
		var dependencies = libBriefJson.dependencies
	    
	    if (dependencies && dependencies.length > 0) {
	    	installBitcodes(installDir, client, dependencies)
	    }
	});
}

function findInLocalCache(owner, repository, minVersion) {
	var bitcodesCache = Paths.get(BITCODE_LOCAL_REPO, owner, repository).toFile()
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