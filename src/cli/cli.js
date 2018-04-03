var cliProcessor = require('./cliProcessor');

function runCLI (args) {
  let commandInfo = processCLI(args);
  commandInfo.command.runner(commandInfo.argsMD, commandInfo.allCommands);
}

function processCLI (args) {
  if (typeof args === 'string') {
    args = args.split(' ');
  }

  return cliProcessor.process(args);
}

exports = {
  runCLI: runCLI,
  processCLI: processCLI
}
