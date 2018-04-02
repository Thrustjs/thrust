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

var console = {
    error: output,
    info: output,
    log: output,
    warn: output
}

function output() {
    var args = Array.prototype.slice.call(arguments)
        .map(function(arg) {
            if (arg === null)
                return "null"
            if (arg === undefined)
                return "undefined"
            var constr = arg.constructor.toString()
            return (constr.contains("function Object()") || constr.contains("function Array()"))
                ? JSON.stringify(arg, null, 4)
                : arg
        })
    print.apply(null, args)
}

function getFileContent(fullPath) {
    return new JString(Files.readAllBytes(Paths.get(fullPath)))
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
        Java.from(jarLibDir.listFiles()).forEach(function(libFile) {
            if (libFile.isFile()) {
                loadJar(libFile.getAbsoluteFile().getAbsolutePath())
            }
        })
    }
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

    Object.keys(ths).forEach(function(prop) {
        if (ths[prop].constructor.name === 'Function') {
            novo[prop] = fncMonitoring.bind(null, ths[prop])
        } else {
            novo[prop] = ths[prop]
        }
    })

    return novo
}

function createGlobalContext(env) {
    var globalContext = new SimpleScriptContext()
    var polyfills = getFileContent(env.appRootDirectory + '/thpolyfills.js')

    globalContext.setAttribute('console', console, ScriptContext.ENGINE_SCOPE)
    globalContext.setAttribute('loadJar', loadJar, ScriptContext.ENGINE_SCOPE)
    globalContext.setAttribute('getConfig', getConfig.bind(null, env), ScriptContext.ENGINE_SCOPE)
    globalContext.setAttribute('getBitcodeConfig', getBitcodeConfig.bind(null, env), ScriptContext.ENGINE_SCOPE)
    globalContext.setAttribute('require', require.bind(env), ScriptContext.ENGINE_SCOPE)
    globalContext.setAttribute('rootPath', env.appRootDirectory, ScriptContext.ENGINE_SCOPE)
    globalContext.setAttribute('exports', {}, ScriptContext.ENGINE_SCOPE)
    env.engine.eval(polyfills, globalContext)

    return globalContext
}

function resolveWichScriptFileToRequire(env, filename) {
    var moduleName = filename.replace(/\.js$/, '')
    var fileScript = moduleName.concat('.js')
    var moduleDirectory

    if (fileScript.match(/^\.\\|^\.\/|^\.\.\\|^\.\.\//g)) {
        moduleDirectory = env.requireCurrentDirectory
    } else {
        moduleDirectory = env.thrustBitcodesDirectory + '/' + moduleName
        fileScript = '/index.js'
    }

    return moduleDirectory + '/' + fileScript.replace(/^\.\\|^\.\//, '')
}

function require(filename) {
    var env = this
    var resolvedFile = resolveWichScriptFileToRequire(env, filename)

    if (this.cacheScript[resolvedFile] !== undefined) {
        // if (resolvedFile.indexOf('aws-sdk-2.203.0.min.js') >= 0 || resolvedFile.indexOf('shortcut.js') >= 0)
        return this.cacheScript[resolvedFile]
    }

    var moduleContent = getFileContent(resolvedFile)

    if (resolvedFile.slice(-5) === '.json') {
        return JSON.parse(moduleContent)
    }

    var requireContext = new SimpleScriptContext()
    var reqCurDirBak = env.requireCurrentDirectory
    var result

    env.requireCurrentDirectory = new File(resolvedFile).getAbsoluteFile().getParent().replace(/\.$/, '')
    requireContext.setBindings(env.globalContext.getBindings(ScriptContext.ENGINE_SCOPE), ScriptContext.ENGINE_SCOPE)
    result = env.engine.eval(moduleContent + '\nexports', requireContext)
    this.cacheScript[resolvedFile] = (env.config.cacheScript) ? result : undefined
    env.requireCurrentDirectory = reqCurDirBak

    result = Object.assign({}, result)
    Object.defineProperty(result, 'monitoring', {
        enumerable: false,
        configurable: false,
        writable: true,
        value: injectMonitoring
    })

    return result
}

function thrust(args) {
    var env = {}
    var __thrust__env__ = env
    var currDir = ''

    env.engine = new ScriptEngineManager().getEngineByName("nashorn")
    env.cacheScript = {}

    if (args.length > 0) {
        var startupFileName = args.shift().replace(/\.js$/, '').concat('.js')
        var startupFile = new File(startupFileName)

        env.appRootDirectory =
            env.requireCurrentDirectory =
            currDir = startupFile.getAbsoluteFile().getParent()
                .replace(/\\\.\\/g, '\\')
                .replace(/\/\/.\//g, '/')
                .replace(/\.$|\\$|\/$/g, '')

        env.libRootDirectory = env.appRootDirectory + '/.lib'
        env.thrustBitcodesDirectory = env.appRootDirectory + '/.lib/bitcodes/thrust-bitcodes'

        System.setProperty('user.dir', currDir)
        loadRuntimeJars(env.libRootDirectory)
        load(currDir + '/thpolyfills.js')
        env.config = JSON.parse(getFileContent(currDir + '/config.json'))
        env.globalContext = createGlobalContext(env)
        require.call(env, './' + startupFile.getName())
    } else {
        print('\nthrust v0.5.0\n\u00A9 2018 ThrustJS Community\n')
    }
}

thrust(arguments)
