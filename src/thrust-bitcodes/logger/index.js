var Logger = Java.type('java.util.logging.Logger');
var ConsoleHandler = Java.type('java.util.logging.ConsoleHandler');
var FileHandler = Java.type('java.util.logging.FileHandler');
var StreamHandler = Java.type('java.util.logging.StreamHandler');
var Formatter = Java.type('java.util.logging.Formatter');
var SimpleFormatter = Java.type('java.util.logging.SimpleFormatter');
var Level = Java.type('java.util.logging.Level');

var StringWriter = Java.type('java.io.StringWriter');
var PrintWriter = Java.type('java.io.PrintWriter');

var simpleFormatterInstance = new SimpleFormatter();
var CustomStreamHandler = Java.extend(StreamHandler);

var ConsoleColors = require('console-colors');

var APP_LOG = 'default';

var FORMAT_TRANSLATIONS = {
    'DATE': '%1$tF',
    'TIME': '%1$tT',
    'DATETIME': '%1$tF %1$tT',
    'TYPE': '%2$s',
    'NAME': '%3$s',
    'COLORRESET': '\u001B[0m',
    'MESSAGE': '%4$s',
    'LINEBREAK': '%n',
    'THROWABLE': '%5$s'
};

var COLORS_BY_LEVEL = {
    CONFIG: ConsoleColors.make(ConsoleColors.COLORS.BLUE),
    SEVERE: ConsoleColors.make(ConsoleColors.COLORS.RED),
    WARNING: ConsoleColors.make(ConsoleColors.COLORS.YELLOW)
};

var FORMATTER_BUILDERS = {};
var DEFAULT_FORMAT = '[datetime][type] colorReset message lineBreak';

var logConfig = getConfig().logger;

if (logConfig && logConfig.format) {
    DEFAULT_FORMAT = logConfig.format;
}

// java.lang.System.setProperty("java.util.logging.SimpleFormatter.format", parseFormat(DEFAULT_FORMAT));

function loggerBuilder(name, options) {
    var logger = Logger.getLogger(name || APP_LOG);
    logger.setUseParentHandlers(false);

    var logOptions = Object.assign({
        handlers: ['console'],
        colored: true,
        format: DEFAULT_FORMAT,
        level: 'info'
    }, logConfig, options);

    logOptions.handlers.forEach(function (handlerType) {
        logger.addHandler(resolveLogHandler(logger, handlerType, logOptions));
    });

    return {
        severe: logFn.bind(logger, Level.SEVERE),
        warning: logFn.bind(logger, Level.WARNING),
        info: logFn.bind(logger, Level.INFO),
        config: logFn.bind(logger, Level.CONFIG),
        fine: logFn.bind(logger, Level.FINE),
        finer: logFn.bind(logger, Level.FINER),
        finest: logFn.bind(logger, Level.FINEST),
        
        handlers: function () {
            return logger.handlers;
        }
    };
}

function resolveLogHandler(logger, handlerType, logOptions) {
    var formatterBuilder, formatter, handlerBuilder, handler;

    if (handlerType.constructor.name == 'String') {
        formatterBuilder = getFormatterBuilder(logOptions);
        formatter = formatterBuilder(logOptions, handlerType == 'console');
        handlerBuilder = getHandlerBuilder(handlerType, logOptions);
        handler = handlerBuilder(logOptions, formatter);
        updateLogLevel(logger, handler, logOptions.level);
    } else {
        setupComplexLogHandler(handlerType);

        var handlerLogOptions = Object.assign({}, logOptions, handlerType);

        formatterBuilder = getFormatterBuilder(handlerLogOptions);
        formatter = formatterBuilder(handlerLogOptions);

        handlerBuilder = getHandlerBuilder(handlerType.handler, handlerLogOptions);
        handler = handlerBuilder(handlerLogOptions, formatter);

        updateLogLevel(logger, handler, handlerLogOptions.level);
    }

    return handler;
}

function setupComplexLogHandler(handlerType) {
    if (handlerType.handler == 'stream') {
        var streamFn;

        if (handlerType.stream) {
            if (handlerType.stream.constructor.name == 'Function') {
                streamFn = handlerType.stream;
            } else {
                streamFn = require(handlerType.stream);
            }
        }

        if (!streamFn || streamFn.constructor.name != 'Function') {
            throw new Error('Para utilizar o handler \'stream\' deve ser passada uma função de stream ou um path para um arquivo que implementa a função.');
        }

        var OutputStreamClass = Java.extend(Java.type('java.io.OutputStream'), {
            write: function (b) {
                var jsArray = Java.from(b);

                while (jsArray[jsArray.length - 1] === 0) { // While the last element is a 0,
                    jsArray.pop();                  // Remove that last element
                }

                streamFn(jsArray);
            }
        });

        handlerType.stream = new OutputStreamClass();
    } else if (handlerType.handler == 'file') {
        if (!handlerType.fileName) {
            throw new Error('Para utilizar o handler \'file\' deve ser passada o nome do arquivo em \'fileName\'.')
        }
    }
}

function updateLogLevel(logger, handler, level) {
    if (level) {
        var levelType = Level[level.toUpperCase()];

        if (!levelType || levelType == null) {
            throw new Error('Invalid log level: ' + level);
        }

        handler.level = levelType;

        if (!logger.level || levelType.intValue() < logger.level.intValue()) {
            logger.level = levelType;
        }
    }
}

function parseFormat(friendlyFormat) {
    return friendlyFormat.replace(/(\w+)/g, function (word) {
        return FORMAT_TRANSLATIONS[word.toUpperCase()] || word;
    })
}

function getFormatterBuilder(options) {
    if (!options.format) {
        throw new Error('Não foi informado um \'format\' para o logger');
    }

    var formatBuilder = FORMATTER_BUILDERS[options.format];

    if (formatBuilder) {
        return formatBuilder;
    }

    FORMATTER_BUILDERS[options.format] = formatBuilder = function (options, isConsoleHandler) {
        var FormatterClass = createFormatter(parseFormat(options.format), options.colored, isConsoleHandler);
        return new FormatterClass();
    };

    return formatBuilder;
}

function getHandlerBuilder(handlerType, options) {
    switch (handlerType) {
        case 'console':
            return getConsoleHandlerBuilder();
        case 'file':
            return getFileHandlerBuilder();
        case 'stream':
            return getStreamHandlerBuilder()
        default:
            throw new Error('LogHandler inválido: ' + options.handler)
    }
}

function createFormatter(format, colored, isConsoleHandler) {
    return Java.extend(Formatter, {
        logFormat: format,
        colored: colored,
        isConsole: isConsoleHandler,
        format: function (lr) {
            var color = getColorByLevel(lr.level, this.colored, this.isConsole);
            var message = simpleFormatterInstance.formatMessage(lr);
            var throwable = '';

            if (lr.thrown) {
                if (lr.thrown.stack) {
                    throwable = lr.thrown.stack;
                } else {
                    var sw = new StringWriter();
                    var pw = new PrintWriter(sw);
                    pw.println();
                    lr.thrown.printStackTrace(pw);
                    pw.close();
                    throwable = sw.toString();
                }
            }

            return java.lang.String.format(color(this.logFormat),
                new java.util.Date(lr.millis),
                lr.level.localizedName,
                lr.loggerName,
                message,
                throwable);
        }
    });
}

function getColorByLevel(level, colored, isConsole) {
    if (colored && isConsole && COLORS_BY_LEVEL[level.name]) {
        return COLORS_BY_LEVEL[level.name];
    }

    return identity;
}

function logFn() {
    var level = arguments[0];
    var msg = arguments[1];

    var args = Array.prototype.slice.call(arguments, 2);

    if (args.length == 0) {
        this.log(level, msg); //level, message
    } else {
        var exception = getLogException(args);

        if (exception) {
            this.log(level, msg, exception); //log(Level level, String msg, Throwable thrown) 
        } else if (args[0].constructor.name == 'Array') {
            this.log(level, msg, args[0]);
        } else {
            this.log(level, msg, args);
        }
    }
}

function getLogException(arguments) {
    var lastArg = arguments.length > 0 && arguments[arguments.length - 1];

    if (lastArg instanceof java.lang.Exception) {
        return lastArg;
    } else if (lastArg instanceof Error) {
        /**
         * Fazemos essa jogada para que desconsideremos o stacktrace 
         * da chamada do log e do getLogException
         */
        var tmp = new java.lang.Exception("Aqui");
        var src = tmp.getStackTrace();
        var ArrayClass = Java.type('java.lang.StackTraceElement[]');
        var dest = new ArrayClass(src.length - 2);

        java.lang.System.arraycopy(src, 2, dest, 0, dest.length);

        var exc = new java.lang.Exception("Teste");
        exc.setStackTrace(dest);

        return exc;
    }
}
function getFileHandlerBuilder() {
    return function (options, formatter) {
        var handler = new FileHandler(options.fileName);
        handler.setFormatter(formatter);
        return handler;
    };
}
function getConsoleHandlerBuilder() {
    return function (options, formatter) {
        var handler = new ConsoleHandler();
        handler.setFormatter(formatter);
        return handler;
    };
}

function getStreamHandlerBuilder() {
    return function (options, formatter) {
        var stream = new CustomStreamHandler(options.stream, formatter) {
            publish: function(record) {
                Java.super(stream).publish(record);
                stream.flush();
            }
    };

    return stream;
};
}

exports = loggerBuilder;