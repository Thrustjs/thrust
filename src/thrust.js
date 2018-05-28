var ClassLoader = Java.type("java.lang.ClassLoader")
var File = Java.type('java.io.File')
var Files = Java.type('java.nio.file.Files')
var JString = Java.type('java.lang.String')
var Paths = Java.type('java.nio.file.Paths')
var StandardCharsets = Java.type('java.nio.charset.StandardCharsets')
var ScriptContext = Java.type('javax.script.ScriptContext')
var ScriptEngine = Java.type('javax.script.ScriptEngine')
var ScriptEngineManager = Java.type('javax.script.ScriptEngineManager')
var SimpleBindings = Java.type('javax.script.SimpleBindings')
var SimpleScriptContext = Java.type('javax.script.SimpleScriptContext')
var System = Java.type('java.lang.System')
var URL = Java.type("java.net.URL")
var URLClassLoader = Java.type("java.net.URLClassLoader")

var _thrustDir = new File(__DIR__);
var _self = this;
var _pollyFillsPath = _thrustDir.getPath() + '/thpolyfills.js';
var _thrustEnv;

var console;

function getFileContent(fullPath) {
    return new JString(Files.readAllBytes(Paths.get(fullPath)))
}

function loadRuntimeJars(env) {
    var jarLibDir = Paths.get(env.libRootDirectory, "jars").toFile()

    if (jarLibDir.exists()) {
        var jarLibFileNames = Java.from(jarLibDir.listFiles()).filter(function (file) {
            return file.isFile();
        }).map(function (file) {
            return file.getName();
        });

        if (jarLibFileNames.length) {
            console.config('+ Loading runtime jars:');

            jarLibFileNames.forEach(function (libFileName) {
                console.config('| - ' + libFileName);

                loadJar.call(env, libFileName);
            });

            console.config('+ finished.');
        }
    }
}

function loadGlobalBitCodes(env) {
    var bitCodeNames = getConfig(env).loadToGlobal;

    if (bitCodeNames) {
        var bitList;

        if (typeof bitCodeNames === 'string') {
            bitList = [bitCodeNames.trim()];
        } else if (Array.isArray(bitCodeNames)) {
            bitList = bitCodeNames.map(function (name) {
                return name.trim();
            });
        } else {
            throw new Error('loadToGlobal property must be a string or an array.');
        }

        console.config('+ Loading global bitcodes:');

        bitList.forEach(function (bitCodeName) {
            console.config('| - ' + bitCodeName);

            var firstIndexToSearch = bitCodeName.lastIndexOf('/') > -1 ? bitCodeName.lastIndexOf('/') + 1 : 0;
            var bitCodeExportName = bitCodeName.substring(firstIndexToSearch, bitCodeName.length());

            dangerouslyLoadToGlobal(env, bitCodeExportName, require.call(env, bitCodeName));
        });

        console.config('+ finished.');
    }
}

function loadJar(jarName) { // eslint-disable-line
    var env = this;

    var searchPath;

    if (jarName.startsWith('./') || jarName.startsWith('../')) {
        searchPath = env.requireCurrentDirectory || env.appRootDirectory
    } else {
        searchPath = env.appRootDirectory + File.separator + '.lib' + File.separator + 'jars';
    }

    var jarPath = searchPath + File.separator + jarName;

    classLoadJar(jarPath);
}

/**
* Usado para ler uma variável de ambiente do SO.
* Se não informado nenhum parametro, é retornado um objeto com todas as variáveis.
* @param {String} name - Nome da variável.
* @param {Object} defaultValue - Opcional, valor default que será utilizado caso a variável seja nula.
*
* @code env('PORT', 8778)
*/
function getEnv(name, defaultValue) {
    var env = this;

    if (arguments.length == 0) {
        return Object.assign({}, env.thrustEnv);
    }

    var value = env.thrustEnv[name];

    if (isEmpty(value)) {
        value = recursiveGet(getConfig(env), name);
    }

    return isEmpty(value) ? defaultValue : value;
}

function recursiveGet(obj, name) {
    if (name.indexOf('.') === -1) {
        return obj[name];
    }

    var propertyPath = name.split('.');
    return propertyPath.reduce(function (result, currProp) {
        return isEmpty(result) ? undefined : result[currProp];
    }, obj)
}

function isEmpty(value) {
    return (value == null || typeof value === 'undefined');
}

function classLoadJar(jarPath) {
    try {
        var jarFile = new File(jarPath);

        if (jarFile.exists()) {
            var method = URLClassLoader.class.getDeclaredMethod('addURL', [URL.class]);

            method.setAccessible(true);
            method.invoke(ClassLoader.getSystemClassLoader(), [jarFile.toURI().toURL()]);
        } else {
            throw new Error('File not found')
        }
    } catch (e) {
        throw new Error("[ERROR] Cannot load jar '" + jarPath + "': " + e.message)
    }
}

/**
* Usado para carregar um objeto para o contexto global
* @param {String} name - Nome que será colocado no contexto global.
* @param {String} name - Objeto que será colocado no contexto global.
*
* @code loadToGlobal('db', {teste: 1})
* @code print(db.teste) //Saída 1
*/
function dangerouslyLoadToGlobal(env, name, obj) {
    env.globalContext.setAttribute(name, obj, ScriptContext.ENGINE_SCOPE)
}

function getConfig(env) {
    return Object.assign({}, env.config)
}

function injectMonitoring(fncMonitoring) {
    var ths = this
    var novo = {}

    Object.keys(ths).forEach(function (prop) {
        if (ths[prop].constructor.name === 'Function') {
            novo[prop] = fncMonitoring.bind(null, ths[prop])
        } else {
            novo[prop] = ths[prop]
        }
    })

    return novo
}

function createGlobalContext(env) {
    var globalContext = new SimpleScriptContext();
    var polyfills = getFileContent(_pollyFillsPath);

    globalContext.setAttribute('env', getEnv.bind(env), ScriptContext.ENGINE_SCOPE)
    globalContext.setAttribute('loadJar', loadJar, ScriptContext.ENGINE_SCOPE)
    globalContext.setAttribute('getConfig', getConfig.bind(null, env), ScriptContext.ENGINE_SCOPE)
    globalContext.setAttribute('getBitcodeConfig', getBitcodeConfig.bind(null, env), ScriptContext.ENGINE_SCOPE)
    globalContext.setAttribute('require', require.bind(env), ScriptContext.ENGINE_SCOPE)
    globalContext.setAttribute('rootPath', env.appRootDirectory, ScriptContext.ENGINE_SCOPE)
    globalContext.setAttribute('exports', {}, ScriptContext.ENGINE_SCOPE)
    globalContext.setAttribute('dangerouslyLoadToGlobal', dangerouslyLoadToGlobal.bind(env), ScriptContext.ENGINE_SCOPE)

    env.engine.eval(polyfills, globalContext);

    env.globalContext = globalContext;

    var ConsoleColors = require.call(env, 'console-colors');
    var logger = require.call(env, 'logger');

    var appLogger = logger(undefined, env.config && env.config.logger);

    console = {
        error: appLogger.severe,
        warn: appLogger.warning,
        log: appLogger.info,
        config: appLogger.config,
        fine: appLogger.fine,
        finer: appLogger.finer,
        finest: appLogger.finest
    };

    globalContext.setAttribute('appLogger', appLogger, ScriptContext.ENGINE_SCOPE)
    globalContext.setAttribute('console', console, ScriptContext.ENGINE_SCOPE)
}

function resolveWichScriptFileToRequire(env, fileName) {
    var relativeRequire = fileName.startsWith('./') || fileName.startsWith('../');
    var relativeToRootRequire = fileName.startsWith('/');

    var possibleFileNames = [];
    var possiblePaths = [];

    if (fileName.endsWith('.js') || fileName.endsWith('.json')) {
        possibleFileNames.push(fileName);
    } else {
        if (fileName.indexOf('/') < 0) {
            fileName = 'thrust-bitcodes/' + fileName;
        }

        possibleFileNames.push(fileName + File.separator + 'index.js');

        possibleFileNames.push(fileName.concat('.js'));
    }

    if (relativeToRootRequire) {
        possiblePaths.push(env.appRootDirectory);
    } else {
        if (!env.appRootDirectory.equals(env.requireCurrentDirectory)) {
            possiblePaths.push(env.requireCurrentDirectory);
        }

        if (relativeRequire) {
            possiblePaths.push(env.appRootDirectory);

            possiblePaths.push(_thrustDir.getPath());
        } else {
            if (env.appRootDirectory) {
                possiblePaths.push(env.appRootDirectory + File.separator + '.lib' + File.separator + 'bitcodes');
            }

            possiblePaths.push(_thrustDir.getPath());

            possiblePaths.push(_thrustDir.getPath() + File.separator + '.lib' + File.separator + 'bitcodes');
        }
    }

    var scriptFile;

    possiblePaths.every(function (basePath) {
        return possibleFileNames.every(function (possibleName) {
            var scriptPath = basePath + File.separator + possibleName;

            var currentFile = new File(scriptPath);

            if (currentFile.exists()) {
                scriptFile = scriptPath;
                return false;
            }

            return true;
        })
    });

    if (!scriptFile) {
        throw new Error("Cannot load '" + fileName + "'");
    }

    return scriptFile;
}

function require(filename) {
    var env = this

    var resolvedFile = resolveWichScriptFileToRequire(env, filename)

    if (env.cacheScript[resolvedFile] !== undefined) {
        return env.cacheScript[resolvedFile]
    }

    var moduleContent = getFileContent(resolvedFile)

    if (resolvedFile.slice(-5) === '.json') {
        return JSON.parse(moduleContent)
    }

    var reqCurDirBak = env.requireCurrentDirectory
    var result

    env.requireCurrentDirectory = new File(resolvedFile).getAbsoluteFile().getParent().replace(/\.$/, '')

    try {
        // TODO: Verificar problema com majesty
        var requireContext = new SimpleScriptContext();
        requireContext.setBindings(env.globalContext.getBindings(ScriptContext.ENGINE_SCOPE), ScriptContext.ENGINE_SCOPE);

        var scriptPrefix = '(function() {var exports = {};\t'
        var scriptSuffix = '\nreturn exports;\t})()\t//# sourceURL=' + resolvedFile
        result = env.engine.eval(scriptPrefix + moduleContent + scriptSuffix, requireContext)
    } finally {
        env.requireCurrentDirectory = reqCurDirBak
    }

    // TODO: Verificar
    if (result && (typeof result === 'object')) {
        result = Object.assign({}, result)
        Object.defineProperty(result, 'monitoring', {
            enumerable: false,
            configurable: false,
            writable: true,
            value: injectMonitoring
        })
    }

    env.cacheScript[resolvedFile] = (env.config && env.config.cacheScript) ? result : undefined;

    return result;
}


/**
* Usado para pegar um getter de configuração
* O getter tem a assinatura (property:String,appId:String).
* É possível passar como 'property' um path do JSON, que
* irá navegar no mesmo e buscar uma configuração.
*
* Caso seja passado um appId como parâmetro, então
* o getter tentará buscar uma configuração com 'property'
* e adicionará o appId como ultimo parâmetro para tentar
* achar uma configuração específica deste app, se não encontrar,
* retorna apenas o valor do 'property', que representa o global
* para todas as possíveis aplicações.
*
*
* @returns {function} Usado para pegar configurações
*
* @code var dbConfig = getBitcodeConfig('database')
* @code dbConfig('path.de.uma.config')
* @code dbConfig('path.de.uma.config', 'MeuApp')
*/
function getBitcodeConfig(env, bitcode) {
    var config = getConfig(env)[bitcode] || {}

    return function (property, appId) {
        var propertyPath = property ? property.split('.') : []

        var result = propertyPath.reduce(function (map, currProp) {
            if (map && map[currProp]) {
                return map[currProp]
            } else {
                return undefined
            }

        }, config)

        if (appId && typeof result === 'object' && result[appId]) {
            result = result[appId]
        }

        return result;
    }
}

function buildThrustEnv(args) {
    var env = {};

    java.lang.System.getenv().forEach(function (key, value) {
        env[key] = value;
    });

    var optionName;
    args.forEach(function (arg) {
        if (arg.indexOf('-') === 0) {
            if (optionName) {
                env[optionName] = true
            }

            optionName = arg.substring(1);
        } else if (optionName) {
            env[optionName] = arg;
            optionName = undefined;
        }
    });

    if (optionName) {
        env[optionName] = true;
    }

    return env;
}

function thrust(args) {
    System.setProperty('thrust.dir', _thrustDir.getPath());

    load(_pollyFillsPath)

    var env = {}
    var currDir = ''

    env.engine = new ScriptEngineManager().getEngineByName("nashorn")
    env.cacheScript = {}

    var startupFileName = '';

    if (args.length > 0) {
        startupFileName = args[0].replace(/\.js$/, '').concat('.js')
    }

    env.thrustEnv = buildThrustEnv(args.slice(1));

    var startupFile = new File(startupFileName)
    var hasStartupFile = startupFile.exists() && startupFile.isFile();

    currDir = hasStartupFile ? startupFile.getAbsoluteFile().getParent() : new File('').getAbsolutePath();

    env.appRootDirectory =
        env.requireCurrentDirectory =
        currDir = currDir
            .replace(/\\\.\\/g, '\\')
            .replace(/\/\/.\//g, '/')
            .replace(/\.$|\\$|\/$/g, '');

    System.setProperty('user.dir', currDir);

    env.libRootDirectory = env.appRootDirectory + '/.lib';
    env.bitcodesDirectory = env.appRootDirectory + '/.lib/bitcodes';

    if (hasStartupFile) {
        env.config = JSON.parse(getFileContent(currDir + '/config.json'));
    }

    createGlobalContext(env);

    if (hasStartupFile) {
        loadRuntimeJars(env)
        loadGlobalBitCodes(env);
    }

    if (hasStartupFile) {
        console.config('Starting application: ' + startupFile.name);
        require.call(env, './' + startupFile.getName())
    } else {
        require.call(env, './cli/cli').runCLI(args);
    }
}

thrust(arguments)
