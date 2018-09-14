"use strict";

var ThreadLocal = Java.type("java.lang.ThreadLocal")
var ClassLoader = Java.type("java.lang.ClassLoader")
var File = Java.type('java.io.File')
var Files = Java.type('java.nio.file.Files')
var JString = Java.type('java.lang.String')
var Paths = Java.type('java.nio.file.Paths')
var ScriptContext = Java.type('javax.script.ScriptContext')
var ScriptEngine = Java.type('javax.script.ScriptEngine')
var ScriptEngineManager = Java.type('javax.script.ScriptEngineManager')
var SimpleBindings = Java.type('javax.script.SimpleBindings')
var SimpleScriptContext = Java.type('javax.script.SimpleScriptContext')
var System = Java.type('java.lang.System')
var URL = Java.type("java.net.URL")
var URLClassLoader = Java.type("java.net.URLClassLoader")

const _self = this
let _pollyFillsPath
let _thrustDir
let _thrustEnv
let _requireLoaderInterceptorFn = [];

// Essa variável é usada para controlar o path atual do require, para que seja possível
// fazer require de "./" dentro de um bitcode por exemplo.
const _requireCurrentDirectory = new ThreadLocal()

function getFileContent(fullPath) {
    let content = new JString(Files.readAllBytes(Paths.get(fullPath)));

    return _requireLoaderInterceptorFn.reduce(function (c, interceptor) {
        return interceptor(fullPath, c);
    }, content);
}
function loadRuntimeJars(env) {
    const jarLibDir = Paths.get(env.libRootDirectory, "jars").toFile()

    if (jarLibDir.exists()) {
        const jarLibFileNames = Java.from(jarLibDir.listFiles()).filter(function (file) {
            return file.isFile()
        }).map(function (file) {
            return file.getName()
        })

        if (jarLibFileNames.length) {
            jarLibFileNames.forEach(function (libFileName) {
                loadJar.call(env, libFileName)
            })
        }
    }
}

function loadGlobalBitCodes(env) {
    const bitCodeNames = getConfig(env).loadToGlobal

    if (bitCodeNames) {
        let bitList

        if (typeof bitCodeNames === 'string') {
            bitList = [bitCodeNames.trim()]
        } else if (Array.isArray(bitCodeNames)) {
            bitList = bitCodeNames.map(function (name) {
                return name.trim()
            })
        } else {
            throw new Error('loadToGlobal property must be a string or an array.')
        }

        bitList.forEach(function (bitCodeName) {
            const firstIndexToSearch = bitCodeName.lastIndexOf('/') > -1 ? bitCodeName.lastIndexOf('/') + 1 : 0
            const bitCodeExportName = bitCodeName.substring(firstIndexToSearch, bitCodeName.length)

            dangerouslyLoadToGlobal(env, bitCodeExportName, require.call(env, bitCodeName))
        })
    }
}

function loadJar(jarName) { // eslint-disable-line
    const env = this

    let searchPath

    if (jarName.startsWith('./') || jarName.startsWith('../')) {
        searchPath = _requireCurrentDirectory.get() || env.appRootDirectory
    } else {
        searchPath = env.appRootDirectory + File.separator + '.lib' + File.separator + 'jars'
    }

    const jarPath = searchPath + File.separator + jarName

    classLoadJar(jarPath)
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
    const env = this

    if (arguments.length == 0) {
        return Object.freeze(Object.assign({}, env.thrustEnv))
    }

    let value = env.thrustEnv[name] || env.thrustEnv[name.replace(/\./g, '_').toUpperCase()];

    if (isEmpty(value)) {
        value = recursiveGet(getConfig(env), name)
    }

    return isEmpty(value) ? defaultValue : value
}

function recursiveGet(obj, name) {
    if (name.indexOf('.') === -1) {
        return obj[name]
    }

    let propertyPath = name.split('.')
    return propertyPath.reduce(function (result, currProp) {
        return isEmpty(result) ? undefined : result[currProp]
    }, obj)
}

function isEmpty(value) {
    return (value == null || typeof value === 'undefined')
}

function classLoadJar(jarPath) {
    try {
        const jarFile = new File(jarPath)

        if (jarFile.exists()) {
            const method = URLClassLoader.class.getDeclaredMethod('addURL', [URL.class])

            method.setAccessible(true)
            method.invoke(ClassLoader.getSystemClassLoader(), [jarFile.toURI().toURL()])
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
* @code dangerouslyLoadToGlobal('db', {teste: 1})
* @code print(db.teste) //Saída 1
*/
function dangerouslyLoadToGlobal(env, name, obj) {
    env.globalContext.setAttribute(name, obj, ScriptContext.ENGINE_SCOPE)
}

function getConfig(env) {
    return env.config;
}

function injectMonitoring(fncMonitoring) {
    const ths = this

    if (ths.constructor.name === 'Function') {
        return fncMonitoring.bind(null, ths)
    } else {
        const novo = {}
        Object.keys(ths).forEach(function (prop) {
            if (ths[prop].constructor.name === 'Function') {
                novo[prop] = fncMonitoring.bind(null, ths[prop])
            } else {
                novo[prop] = ths[prop]
            }
        })

        return novo
    }
}

function createGlobalContext(env) {
    const globalContext = new SimpleScriptContext()
    const polyfills = getFileContent(_pollyFillsPath)

    let bindedRequire = require.bind(env);
    bindedRequire.addInterceptor = addRequireLoaderInterceptor;

    globalContext.setAttribute('env', getEnv.bind(env), ScriptContext.ENGINE_SCOPE)
    globalContext.setAttribute('loadJar', loadJar.bind(env), ScriptContext.ENGINE_SCOPE)
    globalContext.setAttribute('getConfig', getConfig.bind(null, env), ScriptContext.ENGINE_SCOPE)
    globalContext.setAttribute('getBitcodeConfig', getBitcodeConfig.bind(null, env), ScriptContext.ENGINE_SCOPE)
    globalContext.setAttribute('require', bindedRequire, ScriptContext.ENGINE_SCOPE)
    globalContext.setAttribute('rootPath', env.appRootDirectory, ScriptContext.ENGINE_SCOPE)
    globalContext.setAttribute('exports', {}, ScriptContext.ENGINE_SCOPE)
    globalContext.setAttribute('dangerouslyLoadToGlobal', dangerouslyLoadToGlobal.bind(null, env), ScriptContext.ENGINE_SCOPE)

    env.engine.eval(polyfills, globalContext)

    env.globalContext = globalContext
}

/* Premissas
fs -> $appPath/.lib/bitcodes/thrust-bitcodes/fs/index.js || $thrustDir/core/fs.js
org/bitcode -> $appPath/.lib/bitcodes/org/bitcode/index.js

/app/util/string -> $appPath/app/util/string.js || $appPath/app/util/string/index.js

./child -> $currDirectory/child.js || $currDirectory/child/index.js
../parent -> $currDirectory/parent.js || $currDirectory/parent/index.js
*/
function resolveWichScriptFileToRequire(env, fileName, requireCurrentDirectory) {
    let moduleDirectory
    let moduleName = fileName.replace(/^\.\\|^\.\//, '')

    if (fileName.startsWith('/')) {
        moduleDirectory = env.appRootDirectory
    } else if (fileName.startsWith('./') || fileName.startsWith('../')) {
        moduleDirectory = requireCurrentDirectory || env.appRootDirectory
    } else if (moduleName.indexOf('/') == -1) {
        moduleDirectory = env.bitcodesDirectory + '/thrust-bitcodes'
    } else {
        moduleDirectory = env.bitcodesDirectory
    }

    let resolvedFile = moduleDirectory + '/' + moduleName

    if (new File(resolvedFile).isDirectory()) {
        resolvedFile += '/index.js'
    } else if (!fileName.endsWith('.js') && !fileName.endsWith('.json')) {
        resolvedFile += '.js'
    }

    if (!new File(resolvedFile).exists()) {
        resolvedFile = _thrustDir.getPath() + '/core/' + moduleName + '.js'

        if (!new File(resolvedFile).exists()) {
            throw new Error("Cannot load '" + fileName + "'")
        }
    }

    return resolvedFile
}

function require(filename) {
    const env = this

    const requireCurrentDirectory = _requireCurrentDirectory.get()

    const resolvedFile = resolveWichScriptFileToRequire(env, filename, requireCurrentDirectory)

    if (env.cacheScript[resolvedFile] !== undefined) {
        return env.cacheScript[resolvedFile]
    }

    const moduleContent = getFileContent(resolvedFile)

    if (resolvedFile.slice(-5) === '.json') {
        return JSON.parse(moduleContent)
    }

    let result

    try {
        _requireCurrentDirectory.set(new File(resolvedFile).getAbsoluteFile().getParent().replace(/\.$/, ''))

        const requireContext = new SimpleScriptContext()
        requireContext.setBindings(env.globalContext.getBindings(ScriptContext.ENGINE_SCOPE), ScriptContext.ENGINE_SCOPE)

        const scriptPrefix = '(function() {let exports = {};let module={exports: exports};\t'
        const scriptSuffix = '\nif (exports !== module.exports) {for (let att in module.exports) {exports[att] = module.exports[att];}}\nreturn exports;\t})()\t//# sourceURL=' + resolvedFile

        result = env.engine.eval(scriptPrefix + moduleContent + scriptSuffix, requireContext)
    } finally {
        _requireCurrentDirectory.set(requireCurrentDirectory)
    }

    if (result) {
        if (typeof result === 'object') {
            result = Object.assign({}, result)

            Object.defineProperty(result, 'monitoring', {
                enumerable: false,
                configurable: false,
                writable: true,
                value: injectMonitoring
            })
        } else if (typeof result === 'function') {
            result.monitoring = injectMonitoring
        }
    }

    env.cacheScript[resolvedFile] = (env.config && env.config.cacheScript) ? result : undefined

    return result
}

function addRequireLoaderInterceptor(fn) {
    _requireLoaderInterceptorFn.push(fn);
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
* @code let dbConfig = getBitcodeConfig('database')
* @code dbConfig('path.de.uma.config')
* @code dbConfig('path.de.uma.config', 'MeuApp')
*/
function getBitcodeConfig(env, bitcode) {
    const config = getConfig(env)[bitcode] || {}

    return function (property, appId) {
        const propertyPath = property ? property.split('.') : []

        let result = propertyPath.reduce(function (map, currProp) {
            if (map && map[currProp]) {
                return map[currProp]
            } else {
                return undefined
            }

        }, config)

        if (appId && typeof result === 'object' && result[appId]) {
            result = result[appId]
        }

        return result
    }
}

function buildThrustEnv(args) {
    const env = {}

    System.getenv().forEach(function (key, value) {
        env[key] = value
    })

    let optionName
    args.forEach(function (arg) {
        if (arg.indexOf('-') === 0) {
            if (optionName) {
                env[optionName] = true
            }

            optionName = arg.substring(1)
        } else if (optionName) {
            env[optionName] = arg
            optionName = undefined
        }
    })

    if (optionName) {
        env[optionName] = true
    }

    return env
}

function buildConfigObj(isGrallVM, hasStartupFile, currDir) {
    try {
        let configPath = hasStartupFile ? currDir : _thrustDir.getPath()
        return Object.freeze(JSON.parse(getFileContent(configPath + '/config.json')));
    } catch (e) {
        return Object.freeze({})
    }
}

function thrust(args) {
    System.setProperty("nashorn.args", "--language=es6")
    System.setProperty("java.security.egd", "file:/dev/urandom")

    const env = {}
    env.thrustEnv = buildThrustEnv(args)

    let isGrallVM = env.thrustEnv.GRAAL == 'true';

    if (env.thrustEnv.THRUSTDIR) {
        _thrustDir = new File(env.thrustEnv.THRUSTDIR)
    } else {
        _thrustDir = new File(__DIR__)
    }

    System.setProperty("thrust.graal", isGrallVM)
    System.setProperty('thrust.dir', _thrustDir.getPath())

    _pollyFillsPath = _thrustDir.getPath() + '/thpolyfills.js'
    load(_pollyFillsPath)

    let currDir = ''

    env.includeAppDependencies = true
    env.engine = new ScriptEngineManager().getEngineByName(isGrallVM ? "graal.js" : "nashorn")
    env.cacheScript = {}

    let startupFileName = ''

    let startupFileArgPos = isGrallVM ? 4 : 0

    if (args.length > startupFileArgPos) {
        startupFileName = args[startupFileArgPos].replace(/\.js$/, '').concat('.js')
    }

    const startupFile = new File(startupFileName)
    const hasStartupFile = startupFile.exists() && startupFile.isFile()

    currDir = hasStartupFile ? startupFile.getAbsoluteFile().getParent() : new File('').getAbsolutePath()

    env.appRootDirectory =
        currDir = currDir
            .replace(/\\\.\\/g, '\\')
            .replace(/\/\/.\//g, '/')
            .replace(/\.$|\\$|\/$/g, '')

    System.setProperty('user.dir', currDir)

    env.libRootDirectory = env.appRootDirectory + '/.lib'
    env.bitcodesDirectory = env.appRootDirectory + '/.lib/bitcodes'
    env.config = buildConfigObj(isGrallVM, hasStartupFile, currDir, isGrallVM)

    createGlobalContext(env)

    if (hasStartupFile) {
        _requireCurrentDirectory.set(currDir)

        loadRuntimeJars(env)
        loadGlobalBitCodes(env)

        require.call(env, './' + startupFile.getName())
    } else {
        _requireCurrentDirectory.set(_thrustDir.getPath())

        env.includeAppDependencies = false
        require.call(env, './cli/cli.js').runCLI(args)
    }
}

thrust(arguments)
