var ClassLoader = Java.type("java.lang.ClassLoader")
var File = Java.type('java.io.File')
var Files = Java.type('java.nio.file.Files')
var JString = Java.type('java.lang.String')
var Paths = Java.type('java.nio.file.Paths')
var StandardCharsets = Java.type('java.nio.charset.StandardCharsets')
var ScriptContext = Java.type('javax.script.ScriptContext')
var ScriptEngineManager = Java.type('javax.script.ScriptEngineManager')
var SimpleBindings = Java.type('javax.script.SimpleBindings')
var SimpleScriptContext = Java.type('javax.script.SimpleScriptContext')
var System = Java.type('java.lang.System')
var URL = Java.type("java.net.URL")
var URLClassLoader = Java.type("java.net.URLClassLoader")

var _thrustDir = new File(__DIR__);
var _self = this;
var _pollyFillsPath = _thrustDir.getPath() + '/thpolyfills.js';

function getFileContent(fullPath) {
    return new JString(Files.readAllBytes(Paths.get(fullPath)))
}

function getThrustDir() {
    return _thrustDir.getPath();
}

function loadJar(fileName) {
    var file = new File(fileName)
    var method = URLClassLoader.class.getDeclaredMethod("addURL", [URL.class])

    method.setAccessible(true)
    method.invoke(ClassLoader.getSystemClassLoader(), [file.toURI().toURL()])
}

function loadRuntimeJars(libPathName) {
    var jarLibDir = Paths.get(libPathName, "jars").toFile()

    if (jarLibDir.exists()) {
        Java.from(jarLibDir.listFiles()).forEach(function (libFile) {
            if (libFile.isFile()) {
                loadJar(libFile.getAbsoluteFile().getAbsolutePath())
            }
        })
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

        bitList.forEach(function (bitCodeName) {
            var firstIndexToSearch = bitCodeName.lastIndexOf('/') > -1 ? bitCodeName.lastIndexOf('/') + 1 : 0;
            var bitCodeExportName = bitCodeName.substring(firstIndexToSearch, bitCodeName.length());

            dangerouslyLoadToGlobal(env, bitCodeExportName, require.call(env, bitCodeName));
        })
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

function getBitcodeConfig(env, bitcode) {
    var path = env.appRootDirectory + '/config.json'
    var configFile = Paths.get(path).toFile()

    if (configFile.exists()) {
        var moduleContent = getFileContent(path)
        var config = JSON.parse(moduleContent)

        return config[bitcode]
    }

    return {}
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

    globalContext.setAttribute('console', console, ScriptContext.ENGINE_SCOPE)
    globalContext.setAttribute('loadJar', loadJar, ScriptContext.ENGINE_SCOPE)
    globalContext.setAttribute('getConfig', getConfig.bind(null, env), ScriptContext.ENGINE_SCOPE)
    globalContext.setAttribute('getBitcodeConfig', getBitcodeConfig.bind(null, env), ScriptContext.ENGINE_SCOPE)
    globalContext.setAttribute('require', require.bind(env), ScriptContext.ENGINE_SCOPE)
    globalContext.setAttribute('rootPath', env.appRootDirectory, ScriptContext.ENGINE_SCOPE)
    globalContext.setAttribute('exports', {}, ScriptContext.ENGINE_SCOPE)
    globalContext.setAttribute('dangerouslyLoadToGlobal', dangerouslyLoadToGlobal.bind(env), ScriptContext.ENGINE_SCOPE)
    globalContext.setAttribute('getThrustDir', getThrustDir, ScriptContext.ENGINE_SCOPE)

    env.engine.eval(polyfills, globalContext);

    return globalContext;
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
        // TODO: Verificar problema com majesty e let
        var requireContext = new SimpleScriptContext()
        requireContext.setBindings(env.globalContext.getBindings(ScriptContext.ENGINE_SCOPE), ScriptContext.ENGINE_SCOPE)
        
        result = env.engine.eval(moduleContent + '\nexports', requireContext)

        env.cacheScript[resolvedFile] = (env.config && env.config.cacheScript) ? result : undefined
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

    return result
}

function thrust(args) {
    System.setProperty("nashorn.args", "--language=es6");
    load(_pollyFillsPath)

    var env = {}
    var __thrust__env__ = env
    var currDir = ''

    env.engine = new ScriptEngineManager().getEngineByName("nashorn")
    env.cacheScript = {}

    var startupFileName = '';

    if (args.length > 0) {
        startupFileName = args[0].replace(/\.js$/, '').concat('.js')
    }

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

    env.globalContext = createGlobalContext(env);

    loadRuntimeJars(env.libRootDirectory)
    loadGlobalBitCodes(env);

    if (hasStartupFile) {
        require.call(env, './' + startupFile.getName())
    } else {
        require.call(env, './cli/cli').runCLI(args);
    }
}

thrust(arguments)
