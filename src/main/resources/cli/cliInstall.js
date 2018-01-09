var File = Java.type("java.io.File")
var Paths = Java.type("java.nio.file.Paths")
var URL = Java.type("java.net.URL")
var Channels = Java.type("java.nio.channels.Channels")
var FileOutputStream = Java.type("java.io.FileOutputStream")
var Long = Java.type("java.lang.Long")
var FilenameFilter = Java.type("java.io.FilenameFilter")
var FileUtils = Java.type("org.apache.commons.io.FileUtils")

var DEF_BITCODES_OWNER = "thrust-bitcodes"
var DEF_LIB_PATH = "lib";

var BITCODE_LOCAL_REPO = Paths.get(java.lang.System.getProperty("user.home"), ".thrust-cache", "bitcodes").toString()

function runInstall(runInfo) {
	var installDir
	
	if (runInfo.args.basePath) {
		installDir = new File(runInfo.args.basePath);
	} else {
		installDir = new File(".").getAbsolutePath()
	}
	
	var briefJsonFile = new File(installDir, "brief.json")

	if (!briefJsonFile.exists()) {
		print("This isn't a thrust app, 'brief.json' not found.")
		return
	}
	
	var client = require("/util/github_client")

	var bitcode = runInfo.args.bitcode
	var bitcodesToInstall;
	
	if (bitcode) { //Install only this bitcode
		bitcodesToInstall = [bitcode];
	} else { //Install all bitcodes based on brief.json
		var briefJson = JSON.parse(FileUtils.readFileToString(briefJsonFile));
		bitcodesToInstall = briefJson.dependencies;
	}
	
	if (!bitcodesToInstall || bitcodesToInstall.length == 0) {
		print('No dependencies was found to install.')
		return;
	}
	
	installBitcodes(installDir, client, bitcodesToInstall);
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
				print("Invalid owner on bitcode: " + bitcode)
				print("Must be 'owner/bitcode' or just 'bitcode' in case of a default repository.")
				return

			}

			if (!repository) {
				print("Invalid repository on bitcode: " + bitcode)
				print("Must be 'owner/bitcode' or just 'bitcode' in case of a default repository.")
				return

			}
		} else {
			repository = bitcode
		}

		if (!owner) {
			owner = DEF_BITCODES_OWNER
		}
		
		var bitCodeIdentifier = owner + "/" + repository;

		print("Installing bitcode: " + bitCodeIdentifier + "...")

		var libBriefJson = client.getBriefJson(owner, repository)

		if (!libBriefJson) {
			print("Invalid bitcode, 'brief.json' was not found on " + bitCodeIdentifier)
			return
		}
		
		var libDir = Paths.get(installDir, DEF_LIB_PATH, owner, repository).toFile()
		
		var cachedBitcode = findInLocalCache(owner, repository, libBriefJson.version)
		
		if (cachedBitcode) {
			print("Found " + bitCodeIdentifier + "@" + cachedBitcode.version  + " on cache.")

			FileUtils.copyDirectory(cachedBitcode.file, libDir)
		} else {
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
		
		var dependencies = libBriefJson.dependencies
	    
	    if (dependencies && dependencies.length > 0) {
	    	print("Installing dependencies of " + bitCodeIdentifier)
	    	installBitcodes(installDir, client, dependencies)
	    }
		
		print("Bitcode " + bitCodeIdentifier + " installed.")
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