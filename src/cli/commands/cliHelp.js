var System = Java.type('java.lang.System')

var ConsoleColors = require('console-colors');

function cliHelp (runInfo, allCommands) {
  var greenColor = ConsoleColors.make(ConsoleColors.COLORS.GREEN);
  var yellowColor = ConsoleColors.make(ConsoleColors.COLORS.YELLOW);
  var blueColor = ConsoleColors.make(ConsoleColors.COLORS.BLUE);
  var magentaColor = ConsoleColors.make(ConsoleColors.COLORS.MAGENTA);

  var cmdName = runInfo && runInfo.args && runInfo.args.cmd;
  var cliCmd;

  if (cmdName) {
    cliCmd = allCommands.find(function (command) {
      return command.name.indexOf(cmdName) > -1;
    });
  }

  if (cliCmd) {
    var argumentsStr = '';
    var optionsStr = '';

    if (cliCmd.args.length > 0) {
      argumentsStr = blueColor(cliCmd.args.map(function (arg) {
        return arg.required ? arg.name : '[' + arg.name + ']';
      }).join(' '));
    }

    if (cliCmd.options && cliCmd.options.length > 0) {
      optionsStr = magentaColor(cliCmd.options.map(function (opt) {
        return '[' + opt.name.map(function (name) {
          return '-'.concat(name);
        }).join(', ') + ']';
      }).join(' '));
    }

    print('usage:', greenColor('thrust'), yellowColor(cmdName), argumentsStr, optionsStr);
    print()

    var tableRows = cliCmd.args.concat(cliCmd.options).map(function (item) {
      var names = item.name;

      if (Array.isArray(item.name)) {
        names = item.name.map(function (name) {
          return '-'.concat(name);
        }).join(', ');
      } else {
        names = '-' + names;
      }

      return [
        names,
        item.description
      ];
    });

    printCliHelpTable(tableRows);
  } else {
    print('usage:', greenColor('thrust'), yellowColor('<command | fileToRun>'), blueColor('[<args>]'), magentaColor('[<options>]'))
    print()

    print('Available commands:')
    print()

    var tableRows = allCommands.map(function (cliCmd) {
      return [
        cliCmd.name.join(', '),
        cliCmd.description
      ];
    });

    printCliHelpTable(tableRows);

    print();
    print('Use', greenColor('thrust'), yellowColor('<command>'), magentaColor('-h'), 'for specific help on some command');
  }
}

function printCliHelpTable (tableRows) {
  var firstColMaxLength = tableRows.reduce(function (maxLength, row) {
    return Math.max(row[0].length, maxLength);
  }, 1) + 5;

  tableRows.forEach(function (row) {
    row.forEach(function (value, index) {
      System.out.print(value);

      if (index === 0) {
        System.out.print(new Array(firstColMaxLength - value.length).join(' '));
      }
    });

    print();
  });
}

exports = {
  name: ['help', '-h'],
  description: 'Show thrust help',
  args: [{
    name: 'cmd',
    description: 'Command name to show usage'
  }],
  options: [],
  runner: cliHelp
}
