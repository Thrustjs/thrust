var URL = Java.type("java.net.URL")
var FileUtils = Java.type("org.apache.commons.io.FileUtils")
var Base64 = require("/util/base64")
var IOException = Java.type("java.io.IOException")

function downloadArchive(destDir, prefix, repository) {
	var url = new URL("https://api.github.com/repos/" + prefix + "/" + repository + "/zipball/master")
	
	FileUtils.copyURLToFile(url, destDir)
}

function getBriefJson(owner, repository) {
	var httpClient = require("/util/httpClient");
	
	try {
		var result = httpClient.get("https://api.github.com/repos/" + owner + "/" + repository + "/contents/brief.json")
		var brief;
		
		if (result) {
			result = JSON.parse(result);
			brief = JSON.parse(Base64.atob(result.content));
		}
	} catch(e) {
		treatRateLimitError(e, "brief.json")
	}
	
	return brief;
}

function downloadFiles(owner, repository, path, destFile) {
	var httpClient = require("/util/httpClient");
	
	try {
		var result = httpClient.get("https://api.github.com/repos/" + owner + "/" + repository + "/contents/" + path)
		
		if (result) {
			result = JSON.parse(result)
			
			if (!Array.isArray(result)) {
				result = [result];
			}
			
			result.forEach(function(file) {
				if (file.type == 'dir') {
					downloadFiles(owner, repository, path + File.separator + file.name, new File(destFile, file.name))
				} else {
					if (file.content) {
						FileUtils.write(new File(destFile, file.name), Base64.atob(file.content));
					} else if (file.download_url) {
						var url = new URL(file.download_url)
						FileUtils.copyURLToFile(url, new File(destFile, file.name))
					} else {
						throw new Error("[ERROR] Failed to download file '" + file.name + "'")
					}
				}
			})
		}
	} catch(e) {
		treatRateLimitError(e, owner + "/" + repository + "/" + path)
	}
}

function treatRateLimitError(e, resource) {
	if (e instanceof IOException) {
		print(e)
		throw new Error("Failed to read " + resource + " from GitHub, you can't install from a private repository yet, or possibly you have surpassed the rate limit of their API.\nMore on: https://developer.github.com/v3/#rate-limiting")
	}
	
	throw e
}

exports = {
	downloadArchive: downloadArchive,
	getBriefJson: getBriefJson,
	downloadFiles: downloadFiles
}