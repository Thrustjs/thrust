var File = Java.type('java.io.File')
var Files = Java.type('java.nio.file.Files')
var Paths = Java.type('java.nio.file.Paths')
var URL = Java.type('java.net.URL')

var fs = require('fs')
var repoDownloder = require('../../util/repoDownloader.js')
var Constants = require('../../util/constants.js');

function runInstall(runInfo) {
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

  var briefJson = fs.readJson(briefJsonFile.getPath());

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
      fs.write(briefJsonFile, JSON.stringify(briefJson, null, 2));
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
    owner = Constants.DEF_BITCODES_OWNER;
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
  bitcodesToInstall.forEach(function (bitcode) {
    var bitcodeInfo = parseBitcodeInfo(bitcode);

    log("Installing bitcode: " + bitcodeInfo.name + "...")

    var libBitcodeDir = Paths.get(installDir, Constants.LIB_PATH_BITCODE, bitcodeInfo.owner, bitcodeInfo.repository).toFile();

    var tempDir;
    var cachedBitcode;
    var libBriefJson;

    if (bitcodeInfo.version) {
      cachedBitcode = findBitcodeInLocalCache(bitcodeInfo.owner, bitcodeInfo.repository, bitcodeInfo.version);

      if (cachedBitcode) {
        copyBitcodeFromCache(cachedBitcode, libBitcodeDir);

        var briefJsonFile = new File(libBitcodeDir, "brief.json")
        libBriefJson = fs.readJson(briefJsonFile);
      }
    }

    if (!cachedBitcode) {
      try {
        tempDir = Files.createTempDirectory(bitcodeInfo.repository + '-install').toFile();

        var zipFile = File.createTempFile(bitcodeInfo.name, ".zip", tempDir)

        repoDownloder.downloadZip(bitcodeInfo.name, bitcodeInfo.version, zipFile)

        var createdFiles = fs.unzip(zipFile.getPath(), tempDir)

        var unzipedDir = new File(tempDir + File.separator + createdFiles[0]);

        var briefJsonFile = new File(unzipedDir, "brief.json")

        if (!briefJsonFile.exists()) {
          throw new Error("Invalid thrust-seed, 'brief.json' was not found on " + briefJsonFile.getAbsolutePath())
        }

        libBriefJson = fs.readJson(briefJsonFile);

        cachedBitcode = findBitcodeInLocalCache(bitcodeInfo.owner, bitcodeInfo.repository, libBriefJson.version)

        if (cachedBitcode) {
          copyBitcodeFromCache(cachedBitcode, libBitcodeDir);
        } else {
          log("Not found on cache, downloading...");

          var pathToCopy = libBriefJson.path

          var libCacheFile = Paths.get(Constants.LOCAL_REPO_BITCODE, bitcodeInfo.owner, bitcodeInfo.repository, libBriefJson.version).toFile();

          if (libCacheFile.exists()) {
            fs.cleanDirectory(libCacheFile);
          } else {
            libCacheFile.mkdirs()
          }

          if (!pathToCopy || pathToCopy == '.') {
            fs.copyDirectory(unzipedDir, libCacheFile)
          } else {
            var fileToCopy = new File(unzipedDir, pathToCopy);

            if (fileToCopy.isDirectory()) {
              fs.copyDirectory(fileToCopy, libCacheFile)
            } else {
              fs.copyFile(fileToCopy, new File(libCacheFile, pathToCopy))
            }

            fs.copyFile(briefJsonFile, new File(libCacheFile, "brief.json"))
          }

          if (libBitcodeDir.exists()) {
            fs.cleanDirectory(libBitcodeDir);
          } else {
            libBitcodeDir.mkdirs()
          }

          fs.copyDirectory(libCacheFile, libBitcodeDir)
        }
      } finally {
        if (tempDir) {
          fs.deleteDirectory(tempDir)
        }
      }
    }

    var dependencies = libBriefJson.dependencies

    if (dependencies) {
      if (Array.isArray(dependencies)) { //An array deps is only bitcode dependencies
        print()
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
  log("Version " + cachedBitcode.version + " found on cache...")

  if (libBitcodeDir.exists()) {
    fs.cleanDirectory(libBitcodeDir);
  } else {
    libBitcodeDir.mkdirs()
  }

  fs.copyDirectory(cachedBitcode.file, libBitcodeDir);
}

function installJarDependencies(installDir, jarDeps) {
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
      fs.copyURLToFile(url, jarCache);
    } else {
      log('Version ' + version + ' found on cache...')
    }

    fs.copyFile(jarCache, libJarFile)

    print('DONE')
  })
}

function formatString(format) {
  var args = Array.prototype.slice.call(arguments, 1);

  return format.replace(/{(\d+)}/g, function (match, number) {
    return typeof args[number] !== 'undefined' ? args[number] : match
  })
}

function findBitcodeInLocalCache(owner, repository, version) {
  var bitcodesCache = Paths.get(Constants.LOCAL_REPO_BITCODE, owner, repository).toFile()

  var nVersion = version && versionToNumber(owner, repository, version);

  if (version) {
    var bitcodeCache = new File(bitcodesCache, version)

    if (bitcodeCache.exists()) {
      return {
        version: version,
        nVersion: nVersion,
        file: bitcodeCache
      }
    }
  } else {
    var files = bitcodesCache.listFiles()

    if (files) {
      return Java.from(files).map(function (bitcodeFile) {
        return {
          version: bitcodeFile.getName(),
          nVersion: versionToNumber(owner, repository, bitcodeFile.getName()),
          file: bitcodeFile
        }
      }).filter(function (bitCodeInfo) {
        return bitCodeInfo.nVersion >= nVersion
      }).sort(function (info1, info2) {
        return info1.nVersion - info2.nVersion
      }).pop()
    }
  }
}

function versionToNumber(owner, repository, version) {
  var nVersion = Number(version.replace(/\./g, ''))

  if (isNaN(nVersion)) {
    throw new Error("[ERROR] Invalid version '" + version + "' on bitcode: " + owner + '/' + repository);
  }

  return nVersion;
}

exports = {
  name: ['install'],
  description: 'Install or update bitcodes on a Thrust app',
  args: [{
    name: 'resource',
    description: 'Name of the bitcode or jar to be installed.'
  }],
  options: [],
  runner: runInstall
}
