var ANSI_RESET = '\u001B[0m'
var ANSI_RED = '\u001B[31m'
var ANSI_GREEN = '\u001B[32m'
var ANSI_BLUE = '\u001B[34m'
var ANSI_CYAN = '\u001B[36m'
var ANSI_WHITE = '\u001B[37m'
var ANSI_DARK_GREY = '\u001B[90m'
var ANSI_LIGHT_RED = '\u001B[91m'
var ANSI_LIGHT_BLUE = '\u001B[94m'

var chai = require('./chai')
// print("chai => ", JSON.stringify( Object.getOwnPropertyNames(chai) ))

var majesty = {
  failures: [],
  successes: [],
  suites: [],
  describe: describe,
  it: it,
  run: run,
  beforeEach: beforeEach,
  afterEach: afterEach,
  nextId: generateId(),
  clean: function() {
    this.failures = []
    this.successes = []
    // this.suites.length = 0
    this.suites.splice(0, this.suites.length)
  },
  report: {
    startExecution: function() {
      print(ANSI_LIGHT_BLUE + '\n### Majesty started ##################################################', ANSI_RESET)
    },
    executionFinished: function() {
      print(ANSI_LIGHT_BLUE + '### Majesty finished #################################################\n', ANSI_RESET)
    },
    startOfSuite: function(suite) {
      // print(ANSI_WHITE, Array(suite.level+1).join("\t"), suite.description, ANSI_DARK_GREY, "running...", ANSI_RESET)
      print(ANSI_WHITE, Array(suite.level + 1).join('    '), suite.description, ANSI_RESET)
    },
    endOfSuite: function(suite) {
      var result = (suite.passed) ? ANSI_GREEN + '[success]' + ANSI_DARK_GREY + '!' : ANSI_LIGHT_RED + 'error' + ANSI_DARK_GREY + '.'

      print(ANSI_DARK_GREY, Array(suite.level + 1).join('    '), 'Finished with', result, ANSI_RESET)
    },
    scenarioExecuted: function(scenario) {
      var result = '' + ANSI_WHITE + '[' + ((scenario.passed) ? ANSI_GREEN + 'OK' : ANSI_LIGHT_RED + 'NO') + ANSI_WHITE + ']' + ANSI_RESET

      print(Array(scenario.level + 1).join('    '), result, ANSI_WHITE + scenario.description, ANSI_RESET)
    }
  }
}

function generateId() {
  var nId = 0

  return function() {
    return ++nId
  }
}

function createSuite(desc, level) {
  return {
    id: majesty.nextId(),
    description: desc || 'anonymous',
    children: [],
    scenarios: [],
    isOpen: true,
    level: level || 0,
    passed: true
  }
}

function createScenario(desc, func, level) {
  return {
    id: majesty.nextId(),
    description: desc || 'anonymous',
    itFunc: func,
    level: level,
    passed: true
  }
}

function determineParentSuite(desc) {
  var lastSuite = majesty.suites.slice(-1).pop()

  if (lastSuite !== undefined && lastSuite.isOpen) {
    var lastChild = lastSuite.children.slice(-1).pop()

    if (lastChild && lastChild.isOpen) { return lastChild }
    else { return lastSuite }
  } else {
    return null
  }
}

function describe(description, specFunc) {
  var parent = determineParentSuite()
  var queue = (parent) ? parent.children : majesty.suites
  var suite = createSuite(description, (parent) ? parent.level + 1 : 0)

  queue.push(suite)
  specFunc()
  suite.isOpen = false
}

function it(description, scenarioFunc) {
  var suite = determineParentSuite()
  var scenario = createScenario(description, scenarioFunc, suite.level + 1)

  suite.scenarios.push(scenario)
}

function beforeEach(beforeFunc) {
  var suite = determineParentSuite();

  ((suite) || this).beforeEachFnc = beforeFunc
}

function afterEach(afterFunc) {
  var suite = determineParentSuite();

  ((suite) || this).afterEachFnc = afterFunc
}

function hasScenario(suite) {
  return suite.scenarios.length > 0
}

function hasEmbeddedSuite(suite) {
  return suite.children.length > 0
}

function processScenario(scenario) {
  try {
    scenario.itFunc()
    scenario.passed = true
    this.successes.push(scenario.description)
  } catch (e) {
    scenario.passed = false
    this.failures.push({ scenario: scenario.description, execption: e })
  }

  this.report.scenarioExecuted(scenario)

  return scenario.passed
}

function runFunc(fncToRun) {
  if (fncToRun) { fncToRun() }
}

function processSuite(suite) {
  this.report.startOfSuite(suite)

  if (hasScenario(suite)) {
    suite.scenarios.forEach(function(scenario) {
      runFunc(suite.beforeEachFnc)
      suite.passed &= processScenario(scenario)
      runFunc(suite.afterEachFnc)
    })
  } else if (hasEmbeddedSuite(suite)) {
    suite.children.forEach(function(embSuite) {
      runFunc(suite.beforeEachFnc)
      suite.passed &= processSuite(embSuite)
      runFunc(suite.afterEachFnc)
    })
  }

  this.report.endOfSuite(suite)

  return suite.passed
}

function run(callbackTestFunc) {
  this.clean()
  processSuite = processSuite.bind(this)
  processScenario = processScenario.bind(this)

  callbackTestFunc(this.describe, this.it, this.beforeEach, this.afterEach, chai.expect, chai.should, chai.assert)

  this.report.startExecution()

  this.suites.forEach(function(suite) {
    runFunc(this.beforeEachFnc)

    processSuite(suite)

    runFunc(this.afterEachFnc)
  }.bind(this))

  this.report.executionFinished()

  return {
    success: this.successes,
    failure: this.failures
  }
}

exports = Object.assign({}, majesty)
