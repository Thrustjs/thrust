var File = Java.type('java.io.File')
var Files = Java.type('java.nio.file.Files')
var Paths = Java.type('java.nio.file.Paths')
var URL = Java.type('java.net.URL')

var FileUtils = require('../../util/fileUtils')
var repoDownloder = require('../../util/repoDownloader')
var Utils = require('../../util/util')
var Constants = require('../../util/constants');

function log (str) {
  java.lang.System.out.print(str);
}

function runInstall (runInfo) {
  var installDir

  if (runInfo.args.basePath) {
    installDir = new File(runInfo.args.basePath)
  } else {
    installDir = new File('').getAbsolutePath()
  }

  var briefJsonFile = new File(installDir, 'brief.json')

  if (!briefJsonFile.exists()) {
    throw new Error("This isn't a thrust app, 'brief.json' not found.")
  }

  var briefJson = readJson(briefJsonFile.getPath());

  var resource = runInfo.args.resource
  var bitcodesToInstall
  var jarsToInstall

  if (resource) { // Install only this resource
    var depParts = resource.split(':')

    if (depParts.length === 3) {
      jarsToInstall = [resource] // is a jar
    } else {
      bitcodesToInstall = [resource] // is a bitcode
    }
  } else { // Install all bitcodes based on brief.json
    var dependencies = briefJson.dependencies

    if (dependencies) {
      if (Array.isArray(dependencies)) { // An array deps is only bitcode dependencies
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

    if ((!bitcodesToInstall || (bitcodesToInstall.length || 0) === 0) && (!jarsToInstall || (jarsToInstall.length || 0) === 0)) {
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

function installBitcodes (installDir, bitcodesToInstall) {
  bitcodesToInstall.forEach(function (bitcode) {
    var repository
    var owner

    if (bitcode.indexOf('/') === -1) {
      owner = Constants.DEF_BITCODES_OWNER;
      repository = bitcode
      bitcode = owner + '/' + repository;
    } else {
      var splitted = bitcode.split('/');
      owner = splitted[0];
      repository = splitted[1];
    }

    log('Installing bitcode: ' + bitcode + '...')

    var libBitcodeDir = Paths.get(installDir, Constants.LIB_PATH_BITCODE, owner, repository).toFile()

    var tempDir;
    var zipFile;

    try {
      tempDir = Files.createTempDirectory(repository + '-install').toFile();
      zipFile = File.createTempFile(bitcode, '.zip', tempDir)

      repoDownloder.downloadZip(bitcode, zipFile)

      var createdFiles = Utils.unzip(zipFile.getPath(), tempDir)

      var unzipedDir = new File(tempDir + File.separator + createdFiles[0]);

      var briefJsonFile = new File(unzipedDir, 'brief.json')

      if (!briefJsonFile.exists()) {
        throw new Error("Invalid thrust-seed, 'brief.json' was not found on " + briefJsonFile.getAbsolutePath())
      }

      var libBriefJson = Utils.readJson(briefJsonFile);

      var cachedBitcode = findBitcodeInLocalCache(owner, repository, libBriefJson.version)

      if (cachedBitcode) {
        log('Version ' + cachedBitcode.version + ' found on cache...')

        if (libBitcodeDir.exists()) {
          FileUtils.cleanDirectory(libBitcodeDir);
        } else {
          libBitcodeDir.mkdirs()
        }

        FileUtils.copyDirectory(cachedBitcode.file, libBitcodeDir);
      } else {
        log('Not found on cache, downloading...');

        var pathToCopy = libBriefJson.path

        var libCacheFile = Paths.get(Constants.LOCAL_REPO_BITCODE, owner, repository, libBriefJson.version).toFile();

        if (libCacheFile.exists()) {
          FileUtils.cleanDirectory(libCacheFile);
        } else {
          libCacheFile.mkdirs()
        }

        if (!pathToCopy || pathToCopy === '.') {
          FileUtils.copyDirectory(unzipedDir, libCacheFile)
        } else {
          var fileToCopy = new File(unzipedDir, pathToCopy);

          if (fileToCopy.isDirectory()) {
            FileUtils.copyDirectory(fileToCopy, libCacheFile)
          } else {
            FileUtils.copyFile(fileToCopy, new File(libCacheFile, pathToCopy))
          }

          FileUtils.copyFile(briefJsonFile, new File(libCacheFile, 'brief.json'))
        }

        if (libBitcodeDir.exists()) {
          FileUtils.cleanDirectory(libBitcodeDir);
        } else {
          libBitcodeDir.mkdirs()
        }

        FileUtils.copyDirectory(libCacheFile, libBitcodeDir)
      }
    } finally {
      FileUtils.deleteQuietly(tempDir);
      FileUtils.deleteQuietly(zipFile);
    }

    var dependencies = libBriefJson.dependencies

    if (dependencies) {
      if (Array.isArray(dependencies)) { // An array deps is only bitcode dependencies
        installBitcodes(installDir, dependencies)
      } else {
        print()
        if (Array.isArray(dependencies.jars)) { // jar dependencies
          installJarDependencies(installDir, dependencies.jars)
        }

        if (Array.isArray(dependencies.bitcodes)) { // bitcode dependencies
          installBitcodes(installDir, dependencies.bitcodes)
        }
      }
    }

    print('DONE')
  });
}

function installJarDependencies (installDir, jarDeps) {
  jarDeps.forEach(function (jarDep) {
    var depParts = jarDep.split(':')

    if (depParts.length !== 3) {
      throw new Error("Failed to install a jar dependency. A dependency must be on this form: 'group:name:version'. [" + jarDep + ']');
    }

    var group = depParts[0]
    var artifact = depParts[1]
    var version = depParts[2]
    var jarName = artifact.concat('-').concat(version).concat('.jar')

    var libJarFile = Paths.get(installDir, Constants.LIB_PATH_JAR, jarName).toFile()

    log('Installing jar: ' + jarName + '...')

    if (libJarFile.exists()) {
      print('jar is already installed')
      return
    }

    var jarCache = Paths.get(Constants.LOCAL_REPO_JAR, group, jarName).toFile()

    if (!jarCache.exists()) { // not found on cache
      log('Not found on cache, downloading...')

      var url = new URL(formatString(Constants.MAVEN_BASE_URL, group.replace(/\./g, '/'), artifact, version, jarName))
      FileUtils.copyURLToFile(url, jarCache);
    } else {
      log('Version ' + version + ' found on cache...')
    }

    FileUtils.copyFile(jarCache, libJarFile)

    print('DONE')
  })
}

function formatString (format) {
  var args = Array.prototype.slice.call(arguments, 1);

  return format.replace(/{(\d+)}/g, function (match, number) {
    return typeof args[number] !== 'undefined' ? args[number] : match
  })
}

function findBitcodeInLocalCache (owner, repository, minVersion) {
  var bitcodesCache = Paths.get(Constants.LOCAL_REPO_BITCODE, owner, repository).toFile()

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
    return Java.from(files).map(function (bitcodeFile) {
      return {
        version: bitcodeFile.getName(),
        nVersion: versionToNumber(owner, repository, bitcodeFile.getName()),
        file: bitcodeFile
      }
    }).filter(function (bitCodeInfo) {
      return nMinVersion === undefined || bitCodeInfo.nVersion >= nMinVersion
    }).sort(function (info1, info2) {
      return info1.nVersion - info2.nVersion
    }).pop()
  }
}

function versionToNumber (owner, repository, version) {
  var nVersion = Number(version.replace(/\./g, ''))

  if (isNaN(nVersion)) {
    throw new Error("[ERROR] Invalid version '" + version + "' on bitcode: " + owner + '/' + repository);
  }

  return nVersion;
}

exports = {
  name: [ 'install' ],
  description: 'Install or update bitcodes on a Thrust app',
  args: [ {
    name: 'resource',
    description: 'Name of the bitcode or jar to be installed.'
  }],
  options: [],
  runner: runInstall
}
