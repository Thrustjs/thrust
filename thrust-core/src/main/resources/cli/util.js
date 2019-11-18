const File = Java.type('java.io.File')
const ZipInputStream = Java.type('java.util.zip.ZipInputStream')
const BufferedOutputStream = Java.type('java.io.BufferedOutputStream')
const FileInputStream = Java.type('java.io.FileInputStream')
const FileOutputStream = Java.type('java.io.FileOutputStream')
const Byte = Java.type('byte[]')
const URLClassLoader = Java.type('java.net.URLClassLoader')
const URLArr = Java.type('java.net.URL[]')
const System = Java.type('java.lang.System')
const Files = Java.type('java.nio.file.Files')
const Paths = Java.type('java.nio.file.Paths')
const JString = Java.type('java.lang.String')
const StandardCharsets = Java.type('java.nio.charset.StandardCharsets')

function unzip(zipFilePath, destDirectory) {
    let destDir

    if (destDirectory) {
        destDir = new File(destDirectory)
        if (!destDir.exists()) {
            destDir.mkdir()
        }
    } else {
        destDirectory = new File('.').getAbsolutePath()
    }

    const createdFiles = []

    const zipIn = new ZipInputStream(new FileInputStream(zipFilePath))
    try {
        let entry = zipIn.getNextEntry()
        while (entry) {
            createdFiles.push(entry.getName())

            var filePath = destDirectory + File.separator + entry.getName()
            if (!entry.isDirectory()) {
                extractFile(zipIn, filePath)
            } else {
                var dir = new File(filePath)
                dir.mkdir()
            }
            zipIn.closeEntry()
            entry = zipIn.getNextEntry()
        }
    } finally {
        try {
            zipIn.close()
        } catch (err) {
            print('Internal error: Failed close ' + zipFilePath)
            print(err)
        }
    }

    return createdFiles
}

function extractFile(zipIn, filePath) {
    const bos = new BufferedOutputStream(new FileOutputStream(filePath))
    const bytesIn = new Byte(4096)
    let read
    try {
        while ((read = zipIn.read(bytesIn)) !== -1) {
            bos.write(bytesIn, 0, read)
        }
    } finally {
        try {
            bos.close()
        } catch (err) {
            print('Failed to close ', filePath)
            print(err)
        }
    }
}

function loadJar(jarPath, classFqn) {
    const f = new File(jarPath)
    const urlArr = new URLArr(1)
    urlArr[0] = f.toURL()
    print(f.toURL())
    const urlCl = new URLClassLoader(urlArr, System.class.getClassLoader())
    const classInst = urlCl.loadClass(classFqn)
    classInst.newInstance()
}

function readJson(filePathName, charSet) {
    let content
    const cs = charSet || StandardCharsets.UTF_8

    try {
        content = new JString(Files.readAllBytes(Paths.get(filePathName)), cs)
    } catch (e) {
        throw new Error('Unable to read file at: ' + filePathName + ', ' + e)
    }
    return JSON.parse(content)
}

exports = {
    unzip,
    loadJar,
    readJson
}
