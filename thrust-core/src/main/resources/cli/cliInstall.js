const File = Java.type('java.io.File')
const Files = Java.type('java.nio.file.Files')
const Paths = Java.type('java.nio.file.Paths')
const URL = Java.type('java.net.URL')
const FileUtils = Java.type('org.apache.commons.io.FileUtils')

const repoDownloder = require('./repoDownloader')
const Utils = require('./util')

const DEF_BITCODES_OWNER = 'thrust-bitcodes'

const MAVEN_BASE_URL = 'http://central.maven.org/maven2/{0}/{1}/{2}/{3}' // group/name/version/jarName

const LIB_PATH = '.lib'
const LIB_PATH_BITCODE = Paths.get(LIB_PATH, 'thrust-bitcodes').toString()
const LIB_PAR_JAR = Paths.get(LIB_PATH, 'jars').toString()

const LOCAL_REPO = Paths.get(java.lang.System.getProperty('user.home'), '.thrust-cache').toString()
const LOCAL_REPO_BITCODE = Paths.get(LOCAL_REPO, 'thrust-bitcodes').toString()
const LOCAL_REPO_JAR = Paths.get(LOCAL_REPO, 'jars').toString()

const log = console.log

function runInstall(runInfo) {
    const installDir = runInfo.args.basePath
        ? new File(runInfo.args.basePath)
        : new File('').getAbsolutePath()

    const briefJsonFile = new File(installDir, 'brief.json')
    if (!briefJsonFile.exists()) {
        throw new Error("This isn't a thrust app, 'brief.json' not found.")
    }
    const briefJson = JSON.parse(FileUtils.readFileToString(briefJsonFile))

    const resource = runInfo.args.resource
    let bitcodesToInstall
    let jarsToInstall

    if (resource) { // Install only this resource
        const depParts = resource.split(':')

        if (depParts.length === 3) {
            jarsToInstall = [resource] // is a jar
        } else {
            bitcodesToInstall = [resource] // is a bitcode
        }
    } else { // Install all bitcodes based on brief.json
        const dependencies = briefJson.dependencies

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

    let depsArr
    if (resource) {
        if (jarsToInstall) {
            depsArr = briefJson.dependencies

            if (!depsArr || Array.isArray(depsArr)) {
                briefJson.dependencies = {
                    bitcodes: depsArr || [],
                    jars: []
                }

                depsArr = briefJson.dependencies.jars
            } else if (depsArr) {
                depsArr = depsArr.jars
            }

            if (!depsArr) {
                depsArr = briefJson.dependencies.jars = []
            }
        } else {
            depsArr = briefJson.dependencies

            if (depsArr && !Array.isArray(depsArr) && depsArr.bitcodes) {
                depsArr = depsArr.bitcodes
            }

            if (!Array.isArray(depsArr)) {
                depsArr = briefJson.dependencies = []
            }
        }

        if (bitcodesToInstall && depsArr.length) {
            const bitcodeInfo = parseBitcodeInfo(resource)

            for (let i = 0; i < depsArr.length; i++) {
                const depInfo = parseBitcodeInfo(depsArr[i])

                if (depInfo.name === bitcodeInfo.name) {
                    depsArr.splice(i, 1)
                    break
                }
            }
        }

        if (depsArr.indexOf(resource) < 0) {
            depsArr.push(resource)

            FileUtils.write(briefJsonFile, JSON.stringify(briefJson, null, 2))
        }
    }
}

function parseBitcodeInfo(name) {
    let owner, repository, version

    if (name.indexOf('@') > -1) {
        const versionIndex = name.indexOf('@')

        version = name.substring(versionIndex + 1)
        name = name.substring(0, versionIndex)
    }

    if (name.indexOf('/') === -1) {
        owner = DEF_BITCODES_OWNER
        repository = name
        name = owner + '/' + repository
    } else {
        const splitted = name.split('/')
        owner = splitted[0]
        repository = splitted[1]
    }

    return {
        name,
        owner,
        repository,
        version
    }
}

function installBitcodes(installDir, bitcodesToInstall) {
    const installBC = (bitcode) => {
        const bitcodeInfo = parseBitcodeInfo(bitcode)

        log('Installing bitcode: ' + bitcodeInfo.name + '...')

        const libBitcodeDir = Paths.get(installDir, LIB_PATH_BITCODE, bitcodeInfo.repository).toFile()

        let tempDir
        let cachedBitcode
        let libBriefJson
        let briefJsonFile

        if (bitcodeInfo.version) {
            cachedBitcode = findBitcodeInLocalCache(bitcodeInfo.owner, bitcodeInfo.repository, bitcodeInfo.version)

            if (cachedBitcode) {
                copyBitcodeFromCache(cachedBitcode, libBitcodeDir)

                briefJsonFile = new File(libBitcodeDir, 'brief.json')
                libBriefJson = Utils.readJson(briefJsonFile.getAbsolutePath())
            }
        }

        if (!cachedBitcode) {
            try {
                tempDir = Files.createTempDirectory(bitcodeInfo.repository + '-install').toFile()

                const zipFile = File.createTempFile(bitcodeInfo.name, '.zip', tempDir)

                repoDownloder.downloadZip(bitcodeInfo.name, bitcodeInfo.version, zipFile)

                const createdFiles = Utils.unzip(zipFile.getPath(), tempDir.getAbsolutePath())

                const unzipedDir = new File(tempDir + File.separator + createdFiles[0])

                briefJsonFile = new File(unzipedDir, 'brief.json')

                if (!briefJsonFile.exists()) {
                    throw new Error("Invalid thrust-seed, 'brief.json' was not found on " + briefJsonFile.getAbsolutePath())
                }

                libBriefJson = Utils.readJson(briefJsonFile.getAbsolutePath())

                cachedBitcode = findBitcodeInLocalCache(bitcodeInfo.owner, bitcodeInfo.repository, libBriefJson.version)

                if (cachedBitcode) {
                    copyBitcodeFromCache(cachedBitcode, libBitcodeDir)
                } else {
                    log('Not found on cache, downloading...')

                    const pathToCopy = libBriefJson.path

                    const libCacheFile = Paths.get(LOCAL_REPO_BITCODE, bitcodeInfo.owner, bitcodeInfo.repository, libBriefJson.version).toFile()

                    if (libCacheFile.exists()) {
                        FileUtils.cleanDirectory(libCacheFile)
                    } else {
                        libCacheFile.mkdirs()
                    }

                    if (!pathToCopy || pathToCopy === '.') {
                        FileUtils.copyDirectory(unzipedDir, libCacheFile)
                    } else {
                        const fileToCopy = new File(unzipedDir, pathToCopy)

                        if (fileToCopy.isDirectory()) {
                            FileUtils.copyDirectory(fileToCopy, libCacheFile)
                        } else {
                            FileUtils.copyFile(fileToCopy, new File(libCacheFile, pathToCopy))
                        }

                        FileUtils.copyFile(briefJsonFile, new File(libCacheFile, 'brief.json'))
                    }

                    if (libBitcodeDir.exists()) {
                        FileUtils.cleanDirectory(libBitcodeDir)
                    } else {
                        libBitcodeDir.mkdirs()
                    }

                    FileUtils.copyDirectory(libCacheFile, libBitcodeDir)
                }
            } finally {
                if (tempDir) {
                    FileUtils.deleteDirectory(tempDir)
                }
            }
        }

        const dependencies = libBriefJson.dependencies

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
    }
    bitcodesToInstall.forEach(installBC)
}

function copyBitcodeFromCache(cachedBitcode, libBitcodeDir) {
    console.log('cachedBitcode:', JSON.stringify(cachedBitcode))
    console.log('libBitcodeDir:', libBitcodeDir)
    log('Version ' + cachedBitcode.version + ' found on cache...')

    if (libBitcodeDir.exists()) {
        FileUtils.cleanDirectory(libBitcodeDir)
    } else {
        libBitcodeDir.mkdirs()
    }

    FileUtils.copyDirectory(cachedBitcode.file, libBitcodeDir)
}

function installJarDependencies(installDir, jarDeps) {
    const installJarDep = (jarDep) => {
        const depParts = jarDep.split(':')

        if (depParts.length !== 3) {
            throw new Error("Failed to install a jar dependency. A dependency must be on this form: 'group:name:version'. [" + jarDep + ']')
        }

        const group = depParts[0]
        const artifact = depParts[1]
        const version = depParts[2]
        const jarName = artifact.concat('-').concat(version).concat('.jar')

        const libJarFile = Paths.get(installDir, LIB_PAR_JAR, jarName).toFile()

        log('Installing jar: ' + jarName + '...')

        if (libJarFile.exists()) {
            print('jar is already installed')
            return
        }

        var jarCache = Paths.get(LOCAL_REPO_JAR, group, jarName).toFile()

        if (!jarCache.exists()) { // not found on cache
            log('Not found on cache, downloading...')

            var url = new URL(formatString(MAVEN_BASE_URL, group.replace(/\./g, '/'), artifact, version, jarName))
            FileUtils.copyURLToFile(url, jarCache)
        } else {
            log('Version ' + version + ' found on cache...')
        }

        FileUtils.copyFile(jarCache, libJarFile)

        print('DONE')
    }
    jarDeps.forEach(installJarDep)
}

function formatString(format) {
    const args = Array.prototype.slice.call(arguments, 1)

    return format.replace(/{(\d+)}/g, (match, number) => typeof args[number] !== 'undefined' ? args[number] : match)
}

function findBitcodeInLocalCache(owner, repository, version) {
    const bitcodesCache = Paths.get(LOCAL_REPO_BITCODE, owner, repository).toFile()

    const nVersion = version && versionToNumber(owner, repository, version)

    if (version) {
        const bitcodeCache = new File(bitcodesCache, version)

        if (bitcodeCache.exists()) {
            return {
                version,
                nVersion,
                file: bitcodeCache
            }
        }
    } else {
        const files = bitcodesCache.listFiles()

        if (files) {
            const mapBitcodeFile = (bitcodeFile) => ({
                version: bitcodeFile.getName(),
                nVersion: versionToNumber(owner, repository, bitcodeFile.getName()),
                file: bitcodeFile
            })
            const filterBitCodeInfo = (bitCodeInfo) => bitCodeInfo.nVersion >= nVersion
            return Java.from(files)
                .map(mapBitcodeFile)
                .filter(filterBitCodeInfo)
                .pop()
        }
    }
}

function versionToNumber(owner, repository, version) {
    var nVersion = Number(version.replace(/\./g, ''))

    if (isNaN(nVersion)) {
        throw new Error("[ERROR] Invalid version '" + version + "' on bitcode: " + owner + '/' + repository)
    }

    return nVersion
}

exports = {
    run: runInstall
}
