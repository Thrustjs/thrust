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

var DEF_SEED_OWNER = "thrust-seeds"
	
function runInit(runInfo) {
	var installDir = runInfo.args.path

    if(installDir) {
    	 var directory = new File(installDir)
         if (!directory.exists()){
             directory.mkdir()
         }
    } else {
    	installDir = new File("").getAbsolutePath()
    }
	
	var installDirFile = new File(installDir)
	
	var fileCount = Files.list(installDirFile.toPath()).count()
	
	if (fileCount > 0) {
		if (runInfo.options.force) {
			FileUtils.cleanDirectory(installDirFile);
		} else {
			print('[ERROR] The directory '+ installDirFile.getAbsolutePath() + ' must be empty. You can use -f option to force init (it will clean the directory)...')
			return
		}
	}
	
    try {
    	var repository
        
        var template = runInfo.options.template
        
        if (template.indexOf('/') == -1) {
        	repository = template;
        	template = DEF_SEED_OWNER + '/' + template;
        } else {
        	repository = template.split('/')[0];
        }
        
        print("Creating a new Thrust app on " + installDir + ", based on seed '" + template + "'. Pease wait...")
        
        var zipFile = new File(installDir, "thrustinit.zip")
        
        repoDownloder.downloadZip(template, '', zipFile)
        
        var createdFiles = Utils.unzip(zipFile.getPath(), installDir)
        
        var unzipedDir = new File(installDir + File.separator + createdFiles[0]);
        
        var briefJsonFile = new File(unzipedDir, "brief.json")
        
        if (!briefJsonFile.exists()) {
        	throw new Error("Invalid thrust-seed, 'brief.json' was not found on " + briefJsonFile.getAbsolutePath())
        }
        
        var templateBrief = Utils.readJson(briefJsonFile.getAbsolutePath());

        FileUtils.copyDirectory(unzipedDir, new File(installDir))

        FileUtils.deleteDirectory(unzipedDir)
        FileUtils.deleteDirectory(new File(installDir + File.separator + "git-hooks"))
        FileUtils.deleteQuietly(new File(installDir + File.separator + "brief.json"))
        FileUtils.deleteQuietly(new File(installDir + File.separator + "README.md"))
        FileUtils.deleteQuietly(new File(installDir + File.separator + "LICENSE"))
        
        FileUtils.deleteQuietly(zipFile)
        
        var projectBrief = Object.create(null)
        projectBrief.name = "thrust-app"
        projectBrief.version =  "1.0"
    	projectBrief.dependencies = templateBrief.dependencies
        
        FileUtils.write(new File(installDir, "brief.json"), JSON.stringify(projectBrief, null, 2));
        
        if (projectBrief.dependencies) {
        	var installer = require('/cli/cliInstall')
        	
    		installer.run({
        		args: {
        			basePath: installDir
        		}
        	})
        }
        
        print()
        
        print("Your thrust app is ready to use.")
    } catch(e) {
    	FileUtils.cleanDirectory(installDirFile);
    	print("Failed to create a new thrust app.");
    	print(e);
    }
}

exports = {
	run: runInit
}