function process(args, cliCommands) {
    var argsMD = {
        args: [],
        options: {
        }
    }

    var optionName

    args.forEach(function (arg) {
        if (arg.indexOf('-') === 0) {
            if (optionName) {
                argsMD.options[optionName] = true
            }

            optionName = arg.substring(1)
        } else if (optionName) {
            argsMD.options[optionName] = arg
            optionName = undefined
        } else {
            argsMD.args.push(arg)
        }
    })

    if (optionName) {
        argsMD.options[optionName] = true
    }

    var nArgs = argsMD.args.length
    var foundByName = false

    var possibleCmd = cliCommands.find(function (cmd) {
        // var nameMatches = cmd.name.find(function (name) {
        //     foundByName = argsMD.args[0] === name
        //     return foundByName
        // })

        return foundByName
    })

    if (!possibleCmd) {
        possibleCmd = cliCommands.find(function (cmd) {
            if (cmd.def && nArgs === cmd.args.length) {
                // Não tem nome, mas o nro de argumentos bate com o default.
                return true
            }
        })
    }

    if (possibleCmd) {
        argsMD.name = possibleCmd.name[0]

        if (foundByName) {
            argsMD.args = argsMD.args.slice(1)
            nArgs = argsMD.args.length
        }

        var requiredArgs = possibleCmd.args.reduce(function (count, arg) {
            return count + (arg.required ? 1 : 0)
        }, 0)

        if (nArgs >= requiredArgs) {
            argsMD.args = possibleCmd.args.reduce(function (args, curr, i) {
                args[curr.name] = argsMD.args[i]
                return args
            }, {})

            if (possibleCmd.options) {
                possibleCmd.options.forEach(function (opt) {
                    var optKey = opt.name.find(function (name) {
                        return argsMD.options.hasOwnProperty(name)
                    })

                    if (optKey && optKey !== opt.name[0]) {
                        argsMD.options[opt.name[0]] = argsMD.options[optKey]
                        delete argsMD.options[optKey]
                    } else if (!optKey || !argsMD.options[optKey]) {
                        argsMD.options[opt.name[0]] = opt.def
                    }
                })
            }
        } else {
            argsMD = undefined
        }
    }

    if (possibleCmd && argsMD) {
        try {
            var run

            if (typeof possibleCmd.runner === 'string') {
                run = require(possibleCmd.runner).run
            } else {
                run = possibleCmd.runner
            }

            run(argsMD)
        } catch (e) {
            print(e.message)
        }
    }
}

exports = {
    process
}
