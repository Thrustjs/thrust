'use strict';

var ThreadLocal = Java.type('java.lang.ThreadLocal')
var ClassLoader = Java.type('java.lang.ClassLoader')
var Context = Java.type('org.graalvm.polyglot.Context')
var File = Java.type('java.io.File')
var Files = Java.type('java.nio.file.Files')
var JString = Java.type('java.lang.String')
var Paths = Java.type('java.nio.file.Paths')
var System = Java.type('java.lang.System')
var URL = Java.type('java.net.URL')
var URLClassLoader = Java.type('java.net.URLClassLoader')

let global = {}
let _requireLoaderInterceptorFn = []

// Essa variável é usada para controlar o path atual do require, para que seja possível
// fazer require de "./" dentro de um bitcode por exemplo.
const _requireCurrentDirectory = new ThreadLocal()

function getFileContent(fullPath) {
    let content = new JString(Files.readAllBytes(Paths.get(fullPath)));

    return _requireLoaderInterceptorFn.reduce((c, interceptor) => {
        return interceptor(fullPath, c);
    }, content);
}

function loadRuntimeJars(env) {
    const jarLibDir = Paths.get(env.libRootDirectory, 'jars').toFile()

    if (jarLibDir.exists()) {
        const jarLibFileNames = Java.from(jarLibDir.listFiles()).filter((file) => {
            return file.isFile()
        }).map((file) => file.getName())

        if (jarLibFileNames.length) {
            jarLibFileNames.forEach((libFileName) => {
                loadJar.call(env, libFileName)
            })
        }
    }
}

function loadGlobalBitCodes(env) {
    const bitCodeNames = getConfig.call(env).loadToGlobal

    if (bitCodeNames) {
        let bitList

        if (typeof bitCodeNames === 'string') {
            bitList = [bitCodeNames.trim()]
        } else if (Array.isArray(bitCodeNames)) {
            bitList = bitCodeNames.map((name) => {
                return name.trim()
            })
        } else {
            throw new Error('loadToGlobal property must be a string or an array.')
        }

        bitList.forEach((bitCodeName) => {
            const firstIndexToSearch = bitCodeName.lastIndexOf('/') > -1 ? bitCodeName.lastIndexOf('/') + 1 : 0
            const bitCodeExportName = bitCodeName.substring(firstIndexToSearch, bitCodeName.length)

            dangerouslyLoadToGlobal(env, bitCodeExportName, requireJS.call(env, bitCodeName))
        })
    }
}

function loadJar(jarName) {
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
    let value = System.getenv(name)

    return isEmpty(value) ? defaultValue : value
}

function isEmpty(value) {
    return (value == null || typeof value === 'undefined')
}

function classLoadJar(jarPath) {
    try {
        const jarFile = new File(jarPath)

        if (jarFile.exists()) {
            const method = URLClassLoader.class.getDeclaredMethod('addURL', URL.class)

            method.setAccessible(true)
            method.invoke(ClassLoader.getSystemClassLoader(), jarFile.toURI().toURL())
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
function dangerouslyLoadToGlobal(name, obj) {
    // function dangerouslyLoadToGlobal(env, name, obj) {
    // env.globalContext.setAttribute(name, obj, ScriptContext.ENGINE_SCOPE)
    global[name] = obj
}

function dangerouslyClearRequireCache(env) {
    this.cacheScript = {};
}

function addOnRequireCache(env, name, obj) {
    this.cacheScript[name] = obj;
}

function getConfig() {
    let env = this
    return env.config
}

function injectMonitoring(fncMonitoring) {
    const ths = this

    if (ths.constructor.name === 'Function') {
        return fncMonitoring.bind(null, ths)
    } else {
        const novo = {}
        Object.keys(ths).forEach((prop) => {
            if (ths[prop].constructor.name === 'Function') {
                novo[prop] = fncMonitoring.bind(null, ths[prop])
            } else {
                novo[prop] = ths[prop]
            }
        })

        return novo
    }
}

function resolveWichScriptFileToRequire(env, fileName, requireCurrentDirectory) {
    let moduleDirectory
    let moduleName = fileName.replace(/^\.\\|^\.\//, '')

    if (fileName.startsWith('/')) {
        moduleDirectory = env.appRootDirectory
    } else if (fileName.startsWith('./') || fileName.startsWith('../')) {
        moduleDirectory = requireCurrentDirectory || env.appRootDirectory
    } else if (moduleName.indexOf('/') === -1) {
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

    // if (!new File(resolvedFile).exists()) {
    //     resolvedFile = _thrustDir.getPath() + '/core/' + moduleName + '.js'
    if (!new File(resolvedFile).exists()) {
        throw new Error("Cannot load '" + fileName + "'")
    }
    // }

    return resolvedFile
}

function requireJS(filename) {
    let result
    const env = this
    const requireCurrentDirectory = _requireCurrentDirectory.get()
    const resolvedFile = resolveWichScriptFileToRequire(env, filename, requireCurrentDirectory)

    if (env.cacheScript[resolvedFile] !== undefined) {
        return env.cacheScript[resolvedFile]
    }

    const moduleContent = getFileContent(resolvedFile)
    // print('\n# ' + resolvedFile + ' ##########\n')
    // print('\n# ' + moduleContent + ' ##########')

    if (resolvedFile.slice(-5) === '.json') {
        return JSON.parse(moduleContent)
    }

    try {
        _requireCurrentDirectory.set(new File(resolvedFile).getAbsoluteFile().getParent().replace(/\.$/, ''))

        let params = `({require: requireJS.bind(${JSON.stringify(env)}),
            getBitcodeConfig: getBitcodeConfig.bind(${JSON.stringify(env)}),
            getConfig: getConfig.bind(${JSON.stringify(env)}),
            rootPath: '${env.appRootDirectory}',
            loadJar,
            getEnv,
            dangerouslyLoadToGlobal: dangerouslyLoadToGlobal.bind(${JSON.stringify(env)}),
            _requireCurrentDirectory
        })`
        let scriptPrefix = `(function({require, getBitcodeConfig, getConfig, rootPath, loadJar, getEnv, dangerouslyLoadToGlobal, _requireCurrentDirectory}) { let exports = {}; `
        let scriptSuffix = `\nreturn exports \n})${params} \n//# sourceURL=${resolvedFile}`
        let code = scriptPrefix + moduleContent + scriptSuffix
        // print('\n\n' + code + '\n\n')
        result = Polyglot.eval('js', code)
        // result = context.eval('js', 'print(isEmpty)')
    } finally {
        _requireCurrentDirectory.set(requireCurrentDirectory)
    }

    // print('== result ===> ', JSON.stringify(result, null, 4))
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
function getBitcodeConfig(bitcode) {
    let env = this
    const config = getConfig.call(env)[bitcode] || {}

    return (property, appId) => {
        const propertyPath = property ? property.split('.') : []

        let result = propertyPath.reduce((map, currProp) => {
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

function buildConfigObj(currDir) {
    try {
        return Object.freeze(JSON.parse(getFileContent(currDir + '/config.json')));
    } catch (e) {
        return Object.freeze({})
    }
}

function thrust(args) {
    System.setProperty('java.security.egd', 'file:/dev/urandom')

    const env = {}
    let currDir = ''

    env.includeAppDependencies = true
    env.cacheScript = {}

    let startupFileName = ''

    if (args.length > 0) {
        startupFileName = args.shift().replace(/\.js$/, '').concat('.js')
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
    env.config = buildConfigObj(currDir)

    if (hasStartupFile) {
        _requireCurrentDirectory.set(currDir)

        loadRuntimeJars(env)
        loadGlobalBitCodes(env)

        requireJS.call(env, './' + startupFile.getName())
    } else {
        // new File("").getAbsolutePath()
        // _requireCurrentDirectory.set(_thrustDir.getPath())
        // env.includeAppDependencies = false
        // require.call(env, './cli/cli.js').runCLI(args)
        print('\nthrust v0.5.5\n\u00A9 2019 ThrustJS Community Edition\n')
    }
}

thrust(arguments)
