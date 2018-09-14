var File = Java.type('java.io.File');
var Files = Java.type('java.nio.file.Files');
var InputStream = Java.type('java.io.InputStream');
var BufferedReader = Java.type('java.io.BufferedReader');
var ZipInputStream = Java.type("java.util.zip.ZipInputStream");
var BufferedOutputStream = Java.type("java.io.BufferedOutputStream");
var FileOutputStream = Java.type('java.io.FileOutputStream');
var FileInputStream = Java.type('java.io.FileInputStream');
var Charsets = Java.type('java.nio.charset.Charset');
var StandardCharsets = Java.type('java.nio.charset.StandardCharsets');
var JString = Java.type('java.lang.String');
var Paths = Java.type('java.nio.file.Paths');
var Byte = Java.type("byte[]")
var StandardCopyOption = Java.type('java.nio.file.StandardCopyOption')
var LinkOption = Java.type('java.nio.file.LinkOption')

var ONE_KB = 1024;
var ONE_MB = ONE_KB * ONE_KB;
var FILE_COPY_BUFFER_SIZE = ONE_MB * 30;

function cleanDirectory(directory) {
  if (typeof directory === 'string') {
    directory = new File(directory);
  }

  var files = verifiedListFiles(directory);

  files.forEach(function (file) {
    forceDelete(file);
  });
}

function verifiedListFiles(directory) {
  if (!directory.exists()) {
    throw new Error(directory + ' does not exist');
  }

  if (!directory.isDirectory()) {
    throw new Error(directory + ' does not exist');
  }

  var files = directory.listFiles();

  if (files == null) { // null if security restricted
    throw new Error('Failed to list contents of ' + directory);
  }

  return Java.from(files);
}

function forceDelete(file) {
  if (file.isDirectory()) {
    deleteDirectory(file);
  } else {
    var filePresent = file.exists();

    if (!file.delete()) {
      if (!filePresent) {
        throw new Error('File does not exist: ' + file);
      }

      throw new Error('Unable to delete file: ' + file);
    }
  }
}

function deleteDirectory(directory) {
  if (typeof directory === 'string') {
    directory = new File(directory);
  }

  if (!directory.exists()) {
    return;
  }

  if (!isSymlink(directory)) {
    cleanDirectory(directory);
  }

  if (!directory.delete()) {
    throw new Error('Unable to delete directory ' + directory + '.');
  }
}

function isSymlink(file) {
  if (file == null) {
    throw new Error('File must not be null');
  }

  return Files.isSymbolicLink(file.toPath());
}

function deleteQuietly(file) {
  if (file == null) {
    return false;
  }

  if (typeof file === 'string') {
    file = new File(file);
  }

  try {
    if (file.isDirectory()) {
      cleanDirectory(file);
    }
  } catch (e) {
  }

  try {
    return file.delete();
  } catch (e) {
    return false;
  }
}

function write(file, str, encoding) {
  if (typeof file === 'string') {
    file = new File(file);
  }

  if (str != null) {
    var out = null;

    try {
      out = openOutputStream(file, false);

      var bytes = strToBytes(str);

      out.write(strToBytes(new JString(bytes, Charsets.forName(encoding || 'UTF-8'))));
      out.flush();
    } finally {
      close(out);
    }
  }
}

function strToBytes(str) {
  var data = [];
  
  for (var i = 0; i < str.length; i++) {
    data.push(str.charCodeAt(i));
  }

  return data;
}

function openOutputStream(file, append) {
  if (file.exists()) {
    if (file.isDirectory()) {
      throw new Error("File '" + file + "' exists but is a directory");
    }
    if (file.canWrite() === false) {
      throw new Error("File '" + file + "' cannot be written to");
    }
  } else {
    var parent = file.getParentFile();

    if (parent != null) {
      if (!parent.mkdirs() && !parent.isDirectory()) {
        throw new Error("Directory '" + parent + "' could not be created");
      }
    }
  }

  return new FileOutputStream(file, append);
}

function copyFile(srcFile, destFile, preserveFileDate) {
  checkFileRequirements(srcFile, destFile);

  if (srcFile.isDirectory()) {
    throw new Error("Source '" + srcFile + "' exists but is a directory");
  }

  if (srcFile.getCanonicalPath().equals(destFile.getCanonicalPath())) {
    throw new Error("Source '" + srcFile + "' and destination '" + destFile + "' are the same");
  }

  var parentFile = destFile.getParentFile();

  if (parentFile != null) {
    if (!parentFile.mkdirs() && !parentFile.isDirectory()) {
      throw new Error("Destination '" + parentFile + "' directory cannot be created");
    }
  }
  if (destFile.exists() && destFile.canWrite() === false) {
    throw new Error("Destination '" + destFile + "' exists but is read-only");
  }

  doCopyFile(srcFile, destFile, preserveFileDate);
}

function doCopyFile(srcFile, destFile, preserveFileDate) {
  if (destFile.exists() && destFile.isDirectory()) {
    throw new Error("Destination '" + destFile + "' exists but is a directory");
  }

  var fis;
  var input;
  var fos;
  var output;

  try {
    fis = new FileInputStream(srcFile);
    input = fis.getChannel();
    fos = new FileOutputStream(destFile);
    output = fos.getChannel()

    var size = input.size(); // TODO See IO-386
    var pos = 0;
    var count = 0;
    while (pos < size) {
      var remain = size - pos;
      count = remain > FILE_COPY_BUFFER_SIZE ? FILE_COPY_BUFFER_SIZE : remain;

      var bytesCopied = output.transferFrom(input, pos, count);

      if (bytesCopied === 0) { // IO-385 - can happen if file is truncated after caching the size
        break; // ensure we don't loop forever
      }

      pos += bytesCopied;
    }
  } finally {
    close(fis);
    close(fos);
  }

  var srcLen = Number(srcFile.length()); // TODO See IO-386
  var dstLen = Number(destFile.length()); // TODO See IO-386

  if (srcLen !== dstLen) {
    throw new Error("Failed to copy full contents from '" +
      srcFile + "' to '" + destFile + "' Expected length: " + srcLen + ' Actual: ' + dstLen);
  }

  if (preserveFileDate) {
    destFile.setLastModified(srcFile.lastModified());
  }
}

function checkFileRequirements(src, dest) {
  if (src == null) {
    throw new Error('Source must not be null');
  }
  if (dest == null) {
    throw new Error('Destination must not be null');
  }
  if (!src.exists()) {
    throw new Error("Source '" + src + "' does not exist");
  }
}

function copyURLToFile(url, destination) {
  if (!destination.exists() && !destination.mkdirs()) {
    throw new Error("Destination '" + destination + "' directory cannot be created");
  }

  if (destination.canWrite() === false) {
    throw new Error("Destination '" + destination + "' cannot be written to");
  }

  var is;

  try {
    is = url.openStream()
    Files.copy(is, destination.toPath(), StandardCopyOption.REPLACE_EXISTING);
  } finally {
    close(is);
  }
}

function copyDirectory(srcDir, destDir) {
  checkFileRequirements(srcDir, destDir);

  if (!srcDir.isDirectory()) {
    throw new Error("Source '" + srcDir + "' exists but is not a directory");
  }

  if (srcDir.getCanonicalPath().equals(destDir.getCanonicalPath())) {
    throw new Error("Source '" + srcDir + "' and destination '" + destDir + "' are the same");
  }

  doCopyDirectory(srcDir, destDir);
}

function doCopyDirectory(srcDir, destDir) {
  // recurse
  var srcFiles = srcDir.listFiles();

  if (srcFiles == null) { // null if abstract pathname does not denote a directory, or if an I/O error occurs
    throw new Error('Failed to list contents of ' + srcDir);
  }

  if (destDir.exists()) {
    if (destDir.isDirectory() === false) {
      throw new Error("Destination '" + destDir + "' exists but is not a directory");
    }
  } else {
    if (!destDir.mkdirs() && !destDir.isDirectory()) {
      throw new Error("Destination '" + destDir + "' directory cannot be created");
    }
  }
  if (destDir.canWrite() === false) {
    throw new Error("Destination '" + destDir + "' cannot be written to");
  }

  Java.from(srcFiles).forEach(function (srcFile) {
    var dstFile = new File(destDir, srcFile.getName());

    if (srcFile.isDirectory()) {
      doCopyDirectory(srcFile, dstFile);
    } else {
      doCopyFile(srcFile, dstFile);
    }
  });
}


/**
 * @desc Lê o conteúdo do arquivo *filePathName* e retorna em uma string.
 * @param {string} filePathName - caminho absoluto ou relativo do arquivo a ser lido e ter o seu conteúdo retornado.
 * @param {java.nio.charset.Charset} charset - o *charset* as ser usado para decodificação (default é UTF_8)
 * @returns {string} - o conteúdo do arquivo.
 * @throws Irá gerar uma exceção caso ocorra algum problema ao ler o arquivo.
 */
function readAll(filePathName, charSet) {
  var content = null
  var cs = charSet || StandardCharsets.UTF_8

  try {
    content = new JString(Files.readAllBytes(Paths.get(filePathName)), cs)
  } catch (e) {
    // print('Error: ' + e.message);
    throw new Error('Unable to read file at: ' + filePathName + ', ' + e)
  }
  return content
}

/**
 * @desc Lê o conteúdo do arquivo *filePathName* em formato JSON e retorna o objeto.
 * @param {string} filePathName - caminho absoluto ou relativo do arquivo a ser lido e ter o seu conteúdo retornado.
 * @param {java.nio.charset.Charset} charset - o *charset* as ser usado para decodificação (default é UTF_8)
 * @returns {string} - o conteúdo do arquivo.
 * @throws Irá gerar uma exceção caso ocorra algum problema ao ler o arquivo.
 */
function readJson(filePathName, charSet) {
  return JSON.parse(readAll(filePathName, charSet));
}

/**
   * @desc Verifica se o arquivo *filePathName* existe.
   * @param {string} filePathName - caminho absoluto ou relativo do arquivo que se deseja verificar a existência.
   * @returns {boolean} - *true* if the file exists; *false* if the file does not exist or its existence cannot be determined.
   */
function exists(filePathName) {
  return Files.exists(Paths.get(filePathName), LinkOption.NOFOLLOW_LINKS)
}

/**
   * @desc Read all lines from a file as a Stream. Unlike readAllLines, this method does not read
   *       all lines into a List, but instead populates lazily as the stream is consumed.
   * @param {string} fileObject - caminho absoluto ou relativo do arquivo a ser lido e ter o seu conteúdo retornado.
   * @param {java.nio.charset.Charset} charset - o *charset* as ser usado para decodificação (default é UTF_8)
   * @returns {java.util.stream.Stream<String>} - the lines from the file as a Stream.
   */
function lines(fileObject, charSet) {
  var cs = charSet || StandardCharsets.UTF_8

  if (typeof (fileObject) === "string") {
    return Files.lines(Paths.get(fileObject), cs)
  }

  var is_java_io_File = fileObject.class.getCanonicalName() === "java.io.File"
  if (fileObject.class || is_java_io_File) {
    return Files.lines(fileObject.toPath(), cs)
  }

  var is_java_io_InputStream = fileObject.class.getInterfaces()
    .find(function (item) {
      return item.getCanonicalName() === "java.io.InputStream"
    }) !== undefined
  if (fileObject.class || is_java_io_InputStream) {
    return new BufferedReader(new InputStreamReader(inputStream, cs)).lines()
  }

  throw 'fileObject type is not valid on fs.lines function!'
}

function unzip(zipFilePath, destDirectory) {
  var destDir = undefined

  if (destDirectory) {
    if (typeof directory === 'string') {
      destDir = new File(destDirectory);
    } else {
      destDir = destDirectory;
      destDirectory = destDirectory.getAbsolutePath()
    }

    if (!destDir.exists()) {
      destDir.mkdir()
    }
  } else {
    destDirectory = new File(".").getAbsolutePath();
  }

  var zipIn;

  try {
    zipIn = new ZipInputStream(new FileInputStream(zipFilePath))

    var createdFiles = [];
    var entry = zipIn.getNextEntry()

    while (entry != null) {
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

    return createdFiles;
  } finally {
    close(zipIn);
  }
}

function extractFile(zipIn, filePath) {
  var bos;

  try {
    bos = new BufferedOutputStream(new FileOutputStream(filePath))

    var bytesIn = new Byte(4096)
    var read = 0

    while ((read = zipIn.read(bytesIn)) !== -1) {
      bos.write(bytesIn, 0, read)
    }
  } finally {
    close(bos);
  }
}

function close(closeable) {
  if (closeable) {
    closeable.close();
  }
}

exports = {
  cleanDirectory: cleanDirectory,
  deleteQuietly: deleteQuietly,
  deleteDirectory: deleteDirectory,
  write: write,
  copyFile: copyFile,
  copyURLToFile: copyURLToFile,
  copyDirectory: copyDirectory,
  readAll: readAll,
  exists: exists,
  lines: lines,
  readJson: readJson,
  unzip: unzip
};