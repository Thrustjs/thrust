exports = {
  ANSI_RESET: '\u001B[0m',
  ANSI_RED: '\u001B[31m',
  ANSI_GREEN: '\u001B[32m',
  ANSI_BLUE: '\u001B[34m',
  ANSI_CYAN: '\u001B[36m',
  ANSI_WHITE: '\u001B[37m',
  ANSI_DARK_GREY: '\u001B[90m',
  ANSI_LIGHT_RED: '\u001B[91m',
  ANSI_LIGHT_BLUE: '\u001B[94m',

  startExecution: function () {
    print(exports.ANSI_LIGHT_BLUE + '\n### Majesty started ##################################################', exports.ANSI_RESET);
    print();
  },
  executionFinished: function (rs) {
    print();

    print(exports.ANSI_LIGHT_BLUE + '### Majesty finished #################################################\n', exports.ANSI_RESET);

    print(rs.success.length, ' scenarios executed with success and ');
    print(rs.failure.length, ' scenarios executed with failure.\n');

    rs.failure.forEach(function (fail) {
      print("[" + fail.scenario + "] =>", fail.execption);
    });
  },
  startOfSuite: function (suite) {
    print(exports.ANSI_WHITE, Array(suite.level + 1).join('    '), suite.description, exports.ANSI_RESET);
  },
  endOfSuite: function (suite) {
    var result = (suite.passed) ? exports.ANSI_GREEN + '[success]' + exports.ANSI_DARK_GREY + '!' : exports.ANSI_LIGHT_RED + 'error' + exports.ANSI_DARK_GREY + '.';

    print(exports.ANSI_DARK_GREY, Array(suite.level + 1).join('    '), 'Finished with', result, exports.ANSI_RESET);
  },
  scenarioExecuted: function (scenario) {
    var result = '' + exports.ANSI_WHITE + '[' + ((scenario.passed) ? exports.ANSI_GREEN + 'OK' : exports.ANSI_LIGHT_RED + 'NO') + exports.ANSI_WHITE + ']' + exports.ANSI_RESET;

    print(Array(scenario.level + 1).join('    '), result, exports.ANSI_WHITE + scenario.description, exports.ANSI_RESET);
  }
}