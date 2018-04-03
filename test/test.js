var majesty = require('majesty');
var Paths = Java.type('java.nio.file.Paths');

let testFiles = collectTestFiles(Paths.get(rootPath).toFile());

function collectTestFiles (baseDir) {
  var testFiles = [];

  Java.from(baseDir.listFiles()).forEach(function (file) {
    if (file.isFile()) {
      if (file.getName().endsWith('.spec.js')) {
        testFiles.push('./' + Paths.get(rootPath).relativize(Paths.get(file.getPath())).toString());
      }
    } else {
      testFiles = testFiles.concat(collectTestFiles(file));
    }
  });

  return testFiles;
}

let res = majesty.run(function () {
  var testArgs = arguments;
  var ctx = this;

  testFiles.forEach(function (testFile) {
    require(testFile).apply(ctx, testArgs);
  });
})

print(res.success.length, ' scenarios executed with success and')
print(res.failure.length, ' scenarios executed with failure.\n')

res.failure.forEach(function (fail) {
  print('[' + fail.scenario + '] =>', fail.execption)
})
