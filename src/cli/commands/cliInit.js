var File = Java.type('java.io.File')
var Files = Java.type('java.nio.file.Files')

var fs = require('fs')
var repoDownloder = require('../../util/repoDownloader.js');
var Constants = require('../../util/constants.js');
var cliInstall = require('./cliInstall.js');

function runInit (runInfo) {
  var installDir = runInfo.args.path

  if (installDir) {
    var directory = new File(installDir)
    if (!directory.exists()) {
      directory.mkdir()
    }
  } else {
    installDir = new File('').getAbsolutePath()
  }

  var installDirFile = new File(installDir)

  var fileCount = Files.list(installDirFile.toPath()).count()

  if (fileCount > 0) {
    if (runInfo.options.force) {
      fs.cleanDirectory(installDirFile);
    } else {
      print('[ERROR] The directory ' + installDirFile.getAbsolutePath() + ' must be empty. You can use -f option to force init (it will clean the directory)...')
      return
    }
  }

  try {
    var template = runInfo.options.template

    if (template.indexOf('/') === -1) {
      template = Constants.DEF_SEED_OWNER + '/' + template;
    }

    print('Creating a new Thrust app on ' + installDir + ", based on seed '" + template + "'. Please wait...")

    var zipFile = new File(installDir, 'thrustinit.zip')

    repoDownloder.downloadZip(template, '', zipFile)

    var createdFiles = fs.unzip(zipFile.getPath(), installDir)

    var unzipedDir = new File(installDir + File.separator + createdFiles[0]);

    var briefJsonFile = new File(unzipedDir, 'brief.json')

    if (!briefJsonFile.exists()) {
      throw new Error("Invalid thrust-seed, 'brief.json' was not found on " + briefJsonFile.getAbsolutePath())
    }

    var templateBrief = fs.readJson(briefJsonFile.getAbsolutePath());

    fs.copyDirectory(unzipedDir, new File(installDir))

    fs.deleteDirectory(unzipedDir)
    fs.deleteDirectory(new File(installDir + File.separator + 'git-hooks'))
    fs.deleteQuietly(new File(installDir + File.separator + 'brief.json'))
    fs.deleteQuietly(new File(installDir + File.separator + 'README.md'))
    fs.deleteQuietly(new File(installDir + File.separator + 'LICENSE'))

    fs.deleteQuietly(zipFile)

    var projectBrief = Object.create(null)
    projectBrief.name = 'thrust-app'
    projectBrief.version = '1.0'
    projectBrief.dependencies = templateBrief.dependencies

    fs.write(new File(installDir, 'brief.json'), JSON.stringify(projectBrief, null, 2));

    if (projectBrief.dependencies) {
      cliInstall.runner({
        args: {
          basePath: installDir
        }
      })
    }

    print()

    print('Your thrust app is ready to use.')
  } catch (e) {
    fs.cleanDirectory(installDirFile);
    print();
    print('Failed to create a new thrust app.');
    throw e;
  }
}

exports = {
  name: [ 'init' ],
  description: 'Create a new Thrust app',
  args: [ {
    name: 'path',
    description: 'Path to create the seed'
  } ],
  options: [ {
    name: [ 'template', 't' ],
    description: 'Template to be used on init',
    def: 'web-complete'
  }, {
    name: [ 'force', 'f' ],
    description: 'Force init on directory, deleting all files before',
    def: false
  } ],
  runner: runInit
}
