var File = Java.type('java.io.File')
var System = Java.type('java.lang.System')

let fs = require('fs')

var COMMANDS = loadCliCommands();

var HELP_CMD = COMMANDS.find(function (cmd) {
  return cmd.name.indexOf('help') > -1;
});

var VERSION_CMD = COMMANDS.find(function (cmd) {
  return cmd.name.indexOf('version') > -1;
});

function processCommand(args) {
  var argsMD = {
    args: [],
    options: {
    }
  };

  var optionName;
  var firstArgument;

  args.forEach(function (arg) {
    if (arg.indexOf('-') === 0) {
      if (optionName) {
        argsMD.options[optionName] = true
      }

      optionName = arg.substring(1);
    } else if (optionName) {
      argsMD.options[optionName] = arg;
      optionName = undefined;
    } else {
      if (!firstArgument) {
        firstArgument = arg;
      } else {
        argsMD.args.push(arg);
      }
    }
  });

  if (optionName) {
    argsMD.options[optionName] = true;
  }

  var possibleCmd;

  // Verificamos se é um comando de help
  if (firstArgument === 'help' || argsMD.options['h']) {
    possibleCmd = HELP_CMD;

    if (argsMD.options['h']) {
      argsMD.args = [firstArgument].concat(argsMD.args);
    }
  } else if (!firstArgument && argsMD.options['v']) { // Verificamos se é um comando apenas de versão
    possibleCmd = VERSION_CMD;
  }

  if (!possibleCmd) { // Se não encontramos, pesquisamos pelo nome
    possibleCmd = COMMANDS.find(function (cmd) {
      return cmd.name.indexOf(firstArgument) > -1;
    });
  }

  if (!possibleCmd) { // Se ainda não encontramos, não existe, mandamos para o help
    possibleCmd = HELP_CMD;
  }

  argsMD.name = possibleCmd.name[0];

  argsMD.args = possibleCmd.args.reduce(function (args, curr, i) {
    args[curr.name] = argsMD.args[i];
    return args;
  }, {});

  if (possibleCmd.options) {
    possibleCmd.options.forEach(function (opt) {
      var optKey = opt.name.find(function (name) {
        return argsMD.options.hasOwnProperty(name);
      });

      if (optKey && optKey !== opt.name[0]) {
        argsMD.options[opt.name[0]] = argsMD.options[optKey];
        delete argsMD.options[optKey];
      } else if (!optKey || !argsMD.options[optKey]) {
        argsMD.options[opt.name[0]] = opt.def;
      }
    });
  }

  return {
    allCommands: COMMANDS,
    command: possibleCmd,
    argsMD: argsMD
  };
}

function loadCliCommands() {
  var commands = [];
  var thrustDir = System.getProperty('thrust.dir');

  Java.from(new File(thrustDir, 'cli/commands').listFiles()).forEach(function (file) {
    if (file.isFile() && file.getName().endsWith('.js')) {
      var requireFile = './commands/' + file.getName();
      commands.push(require(requireFile));
    }
  });

  const cliExtensions = fs.readJson('./brief.json')['cli-extensions']

  if (cliExtensions) {
    let list

    if (typeof cliExtensions === 'string') {
      list = [cliExtensions.trim()]
    } else if (Array.isArray(cliExtensions)) {
      list = cliExtensions.map(function (name) {
        return name.trim()
      })
    } else {
      throw new Error('cli-extensions property must be a string or an array.')
    }

    list.forEach(function (cliExtension) {
      try {
        commands.push(require(cliExtension));
      } catch (e) {
        console.log('Falha ao carregar extensão de cli:', cliExtension, e.message)
      }
    })
  }

  return commands;
}

exports = {
  process: processCommand
}
