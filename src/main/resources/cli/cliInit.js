var File = Java.type("java.io.File")
var Files = Java.type("java.nio.file.Files")
var Paths = Java.type("java.nio.file.Paths")
var URL = Java.type("java.net.URL")
var Channels = Java.type("java.nio.channels.Channels")
var FileOutputStream = Java.type("java.io.FileOutputStream")
var Long = Java.type("java.lang.Long")
var FilenameFilter = Java.type("java.io.FilenameFilter")
var FileUtils = Java.type("org.apache.commons.io.FileUtils")

var DEF_SEED_OWNER = "thrust-seeds"
	
function runInit(runInfo) {
	var installDir = runInfo.args.path

    if(installDir) {
    	 var directory = new File(installDir)
         if (!directory.exists()){
             directory.mkdir()
         }
    } else {
    	installDir = new File(".").getAbsolutePath()
    }
	
	var fileCount = Files.list(Paths.get(installDir)).count()
	
	if (fileCount > 0) {
		//print('[ERROR] It seems that you already have files on ' + installDir + '. Please, delete them.')
		//return;
	}
    
    var owner
    var repository
    
    var template = runInfo.options.template
    
    if (template.indexOf('/') > -1) {
    	var t = template.split('/')
    	owner = t[0]
    	repository = t[1]
    	
    	if (!owner) {
    		print("Invalid owner on template: " + template)
    		print("Must be 'owner/template' or just 'template' in case of a default seed.")
    		return
    	}
    	
    	if (!repository) {
    		print("Invalid repository on template: " + repository)
    		print("Must be 'owner/template' or just 'template' in case of a default seed.")
    		return
    	}
    } else {
    	repository = template
    }
    
    if (!owner) {
    	owner = DEF_SEED_OWNER
    }
    
    var client = require("/util/github_client")
    
    print("Creating a new Thrust app on " + installDir + ", based on seed '" + repository + "'. Pease wait...")
    
    var briefJson = client.getBriefJson(owner, repository)
    
    if (!briefJson) {
    	print("Invalid thrust-seed, 'brief.json' was not found on " + owner + "/" + repository)
    	return
    }
    
    var zipFileName = "thrustinit.zip"
    var zipFile = new File(installDir, zipFileName)
    
    client.downloadArchive(zipFile, owner, repository)
    
    var Utils = require("/util/util")
    Utils.unzip(zipFile.getPath(), installDir)

    var file = new File(installDir)
    var directories = file.list(new FilenameFilter() {
        accept: function (current, name) {
	        var file = new File(current, name)
	        return file.isDirectory() && file.getAbsolutePath().indexOf(repository) > -1
        }
    })

    FileUtils.copyDirectory(new File(installDir + File.separator + directories[0]), new File(installDir))

    FileUtils.deleteDirectory(new File(installDir + File.separator + directories[0]))
    FileUtils.deleteDirectory(new File(installDir + File.separator + "git-hooks"))
    FileUtils.deleteQuietly(new File(installDir + File.separator + ".gitignore"))
    FileUtils.deleteQuietly(new File(installDir + File.separator + "README.md"))
    FileUtils.deleteQuietly(new File(installDir + File.separator + "LICENSE"))
    
    FileUtils.deleteQuietly(zipFile)
    
    var dependencies = briefJson.dependencies
    
    if (dependencies && dependencies.length > 0) {
    	var installer = require('/cli/cliInstall')
    	
		installer.run({
    		args: {
    			basePath: installDir
    		}
    	})
    }
    
    print("Thrust app created")
}

exports = {
	run: runInit
}