var File = Java.type('java.io.File')
var Files = Java.type('java.nio.file.Files')

var fs = require('fs')
var repoDownloder = require('../../util/repoDownloader')

var THRUST_REPO = 'Thrustjs/thrust';

function runUpdate(runInfo) {
  var currentBriefJson = getCurrentVersionBrief();

  var version = runInfo.args.version || 'master';
  var thrustVersionRepo = THRUST_REPO + '#' + version;

  console.log('Your current installed version is:', currentBriefJson.version);
  console.log('Attempting to update to version:', version);

  var tempDir;
  var zipFile;

  try {
    tempDir = Files.createTempDirectory('thrust-update').toFile();
    zipFile = File.createTempFile('thrust', '.zip', tempDir);

    try {
      repoDownloder.downloadZip(thrustVersionRepo, zipFile);
    } catch (e) {
      console.log('Version ' + (runInfo.args.version || 'master') + ' does not exist.');
      console.log('Check our releases on our official repository.');
      return;
    }

    var createdFiles = fs.unzip(zipFile.getPath(), tempDir)

    var unzipedDir = new File(tempDir + File.separator + createdFiles[0]);

    var downloadedThrustSrc = new File(unzipedDir, 'src');

    var downloadedBriefJsonFile = new File(downloadedThrustSrc, 'brief.json')

    if (!downloadedBriefJsonFile.exists()) {
      throw new Error("Invalid thrust app, 'brief.json' was not found on " + briefJsonFile.getAbsolutePath())
    }

    var downloadedBriefJson = fs.readJson(downloadedBriefJsonFile);

    var currentVersion = versionToNumber(currentBriefJson.version);
    var downloadedVersion = versionToNumber(downloadedBriefJson.version);

    if (currentVersion >= downloadedVersion) {
      console.log('The current installed version is greater than the desired version.');
      return;
    }

    var thrustDir = java.lang.System.getProperty('thrust.dir');

    var distDir = new File(thrustDir, '../thrust-download');
    var backupDir = new File(thrustDir, '../thrust-bkp');

    fs.copyDirectory(thrustDir, backupDir);
    fs.copyDirectory(downloadedThrustSrc, distDir);

    console.log('Version successfully updated to:', downloadedBriefJson.version);
  } finally {
    fs.deleteQuietly(tempDir);
    fs.deleteQuietly(zipFile);
  }
}

function getCurrentVersionBrief() {
  var briefJsonFile = new File(new File(java.lang.System.getProperty('thrust.dir')).getPath(), 'brief.json')

  if (!briefJsonFile.exists()) {
    throw new Error("This isn't a thrust app, 'brief.json' not found.")
  }

  return readJson(briefJsonFile.getPath());
}

function versionToNumber(version) {
  var nVersion = Number(version.replace(/\./g, ''))

  if (isNaN(nVersion)) {
    throw new Error("[ERROR] Invalid version '" + version + "' on thrust update");
  }

  return nVersion;
}

exports = {
  name: ['update'],
  description: 'Update your thrust',
  args: [{
    name: 'version',
    description: 'Version to be installed'
  }],
  options: [],
  runner: runUpdate
}
