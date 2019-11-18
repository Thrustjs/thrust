const File = Java.type('java.io.File')
const Files = Java.type('java.nio.file.Files')
const FileUtils = Java.type('org.apache.commons.io.FileUtils')

const repoDownloder = require('./repoDownloader')
const Utils = require('./util')

const DEF_SEED_OWNER = 'thrust-seeds'

function runInit(runInfo) {
    let directory
    let installDir = runInfo.args.path

    if (installDir) {
        directory = new File(installDir)
        if (!directory.exists()) {
            directory.mkdir()
        }
    } else {
        installDir = new File('').getAbsolutePath()
    }

    const installDirFile = new File(installDir)

    const fileCount = Files.list(installDirFile.toPath()).count()

    if (fileCount > 0) {
        if (runInfo.options.force) {
            FileUtils.cleanDirectory(installDirFile)
        } else {
            print('[ERROR] The directory ' + installDirFile.getAbsolutePath() + ' must be empty. You can use -f option to force init (it will clean the directory)...')
            return
        }
    }

    try {
        let template = runInfo.options.template

        if (template.indexOf('/') === -1) {
            template = DEF_SEED_OWNER + '/' + template
        }

        print('Creating a new Thrust app on ' + installDir + ", based on seed '" + template + "'. Pease wait...")

        const zipFile = new File(installDir, 'thrustinit.zip')

        repoDownloder.downloadZip(template, '', zipFile)

        const createdFiles = Utils.unzip(zipFile.getPath(), installDir)

        const unzipedDir = new File(installDir + File.separator + createdFiles[0])

        const briefJsonFile = new File(unzipedDir, 'brief.json')

        if (!briefJsonFile.exists()) {
            throw new Error("Invalid thrust-seed, 'brief.json' was not found on " + briefJsonFile.getAbsolutePath())
        }

        const templateBrief = Utils.readJson(briefJsonFile.getAbsolutePath())

        FileUtils.copyDirectory(unzipedDir, new File(installDir))

        FileUtils.deleteDirectory(unzipedDir)
        FileUtils.deleteDirectory(new File(installDir + File.separator + 'git-hooks'))
        FileUtils.deleteQuietly(new File(installDir + File.separator + 'brief.json'))
        FileUtils.deleteQuietly(new File(installDir + File.separator + 'README.md'))
        FileUtils.deleteQuietly(new File(installDir + File.separator + 'LICENSE'))

        FileUtils.deleteQuietly(zipFile)

        const projectBrief = Object.freeze({
            name: 'thrust-app',
            version: '1.0',
            dependencies: templateBrief.dependencies
        })

        FileUtils.write(new File(installDir, 'brief.json'), JSON.stringify(projectBrief, null, 2))

        if (projectBrief.dependencies) {
            const installer = require('/cli/cliInstall')

            installer.run({
                args: {
                    basePath: installDir
                }
            })
        }

        print()

        print('Your thrust app is ready to use.')
    } catch (e) {
        FileUtils.cleanDirectory(installDirFile)
        print('Failed to create a new thrust app.')
        print(e)
    }
}

exports = {
    run: runInit
}
