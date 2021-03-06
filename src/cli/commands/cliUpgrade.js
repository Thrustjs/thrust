var File = Java.type('java.io.File')
var Files = Java.type('java.nio.file.Files')
var System = Java.type('java.lang.System')

var fs = require('fs')
var repoDownloder = require('../../util/repoDownloader.js')

var THRUST_REPO = 'Thrustjs/thrust';

function runUpgrade(runInfo) {
  var currentBriefJson = getCurrentVersionBrief();

  var version = runInfo.args.version || 'master';

  console.log('Your current installed version is:', currentBriefJson.version);
  console.log('Attempting to upgrade to version:', version);

  var tempDir;
  var zipFile;

  try {
    tempDir = Files.createTempDirectory('thrust-update').toFile();
    zipFile = File.createTempFile('thrust', '.zip', tempDir);

    try {
      repoDownloder.downloadZip(THRUST_REPO, version, zipFile);
    } catch (e) {
      console.log('Version ' + (runInfo.args.version || 'master') + ' does not exist.');
      console.log('Check our releases on our official repository. [https://github.com/Thrustjs/thrust/releases/]');
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

    var thrustDir = new File(System.getProperty('thrust.dir'));
    var backupDir = new File(thrustDir, '../thrust-bkp');
    var distDir = new File(thrustDir, '../lib');

    fs.copyDirectory(thrustDir, backupDir);
    fs.copyDirectory(downloadedThrustSrc, distDir);

    console.log('Version successfully updated to:', downloadedBriefJson.version);
  } finally {
    fs.deleteQuietly(tempDir);
    fs.deleteQuietly(zipFile);
  }
}

function getCurrentVersionBrief() {
  var briefJsonFile = new File(new File(System.getProperty('thrust.dir')).getPath(), 'brief.json')

  if (!briefJsonFile.exists()) {
    throw new Error("This isn't a thrust app, 'brief.json' not found.")
  }

  return fs.readJson(briefJsonFile.getPath());
}

function versionToNumber(version) {
  var nVersion = Number(version.replace(/\./g, ''))

  if (isNaN(nVersion)) {
    throw new Error("[ERROR] Invalid version '" + version + "' on thrust upgrade");
  }

  return nVersion;
}

exports = {
  name: ['upgrade'],
  description: 'Upgrade your thrust',
  args: [{
    name: 'version',
    description: 'Version to be installed'
  }],
  options: [],
  runner: runUpgrade
}
