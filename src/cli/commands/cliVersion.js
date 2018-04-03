var ConsoleColors = require('../../util/consoleColors');

function cliVersion (runInfo) {
  let greenColor = ConsoleColors.make(ConsoleColors.COLORS.GREEN);
  print(greenColor('v') + require('./brief.json').version);
}

exports = {
  name: ['version', '-v'],
  description: 'Show thrust version',
  args: [],
  options: [],
  runner: cliVersion
}
