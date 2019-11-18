var CLI_COMMANDS = [ {
    name: [ 'help' ],
    description: 'Show thrust help',
    args: [{
        name: 'cmd',
        description: 'Command name to show usage'
    }],
    options: [],
    runner: cliHelp
}, {
    name: [ 'init' ],
    description: 'Create a new Thrust app',
    args: [ {
        name: 'path',
        description: 'Path to create the seed'
    } ],
    options: [ {
        name: [ 'template', 't' ],
        description: 'Template to be used on init',
        def: 'web-complete'
    }, {
        name: [ 'force', 'f' ],
        description: 'Force init on directory, deleting all files before',
        def: false
    } ],
    runner: './cliInit'
}, {
    name: [ 'install' ],
    description: 'Install or update bitcodes on a Thrust app',
    args: [ {
        name: 'resource',
        description: 'Name of the bitcode or jar to be installed.'
    }],
    runner: './cliInstall'
} ];

function process(args) {
    console.log('Processing:', JSON.stringify(args))
    if (typeof args === 'string') {
        args = args.split(',');
    }

    require('./cliProcessor').process(args, CLI_COMMANDS);
}

function cliHelp(runInfo) {
    print('usage: thrust <command> [<args>] [<options>]')
    print()

    print('Available commands:')
    print()

    CLI_COMMANDS.forEach(function (cliCmd) {
        var cmdHelp = cliCmd.name.join(', ') + '   ' + cliCmd.description
        print(cmdHelp)
    })
}

exports = {
    process
}
