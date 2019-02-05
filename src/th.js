// 'use strict';

const ThreadLocal = Java.type('java.lang.ThreadLocal')

const require = (function(filename) {
    const File = Java.type('java.io.File')
    const Files = Java.type('java.nio.file.Files')
    const JString = Java.type('java.lang.String')
    const Paths = Java.type('java.nio.file.Paths')
    const ClassLoader = Java.type('java.lang.ClassLoader')
    const URL = Java.type('java.net.URL')
    const URLClassLoader = Java.type('java.net.URLClassLoader')
    let ctx = this

    const execScript = (env, moduleContent) => {
        const exec = ({ require, getBitcodeConfig, getConfig, rootPath, loadJar, getEnv, dangerouslyLoadToGlobal, _requireCurrentDirector }, moduleContent) => {
            let exports = {};
            let module = { exports };
            let scriptSuffix = `\n;if (exports !== module.exports) { if (typeof module.exports !== 'object') { exports = module.exports } else if (typeof exports === 'object') { Object.assign(exports,module.exports) } }; return exports \t//# sourceURL=${resolvedFile}`
            let codeFnc = new Function('require', 'getBitcodeConfig', 'getConfig', 'rootPath', 'loadJar', 'getEnv', 'dangerouslyLoadToGlobal', '_requireCurrentDirectory', 'exports', 'module', moduleContent + scriptSuffix)

            let rs = codeFnc.call(env, require, getBitcodeConfig, getConfig, rootPath, loadJar, getEnv, dangerouslyLoadToGlobal, _requireCurrentDirector, exports, module)

            // console.log('## RESULT #####\n' + JSON.stringify(rs) + '\n' + rs);
            return rs
        }

        return exec(env, moduleContent)
    }

    let env = ((args) => {
        let startupFile
        let hasStartupFile
        // let includeAppDependencies = true
        // let _requireLoaderInterceptorFn = []

        function getConfig() {
            return ctx.config
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
            // let env = this
            // const config = getConfig.call(env)[bitcode] || {}
            const config = getConfig()

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

        /**
        * Usado para carregar um objeto para o contexto global
        * @param {String} name - Nome que será colocado no contexto global.
        * @param {String} name - Objeto que será colocado no contexto global.
        *
        * @code dangerouslyLoadToGlobal('db', {teste: 1})
        * @code print(db.teste) //Saída 1
        */
        function dangerouslyLoadToGlobal(name, obj) {
            global[name] = obj
        }

        function loadGlobalBitCodes() {
            const bitCodeNames = getConfig().loadToGlobal

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
                    dangerouslyLoadToGlobal(bitCodeExportName, require(bitCodeName))
                })
            }
        }

        const classLoadJar = (jarPath) => {
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

        const loadJar = (rootPath, jarName) => {
            // const env = this
            let searchPath

            if (jarName.startsWith('./') || jarName.startsWith('../')) {
                searchPath = ctx._requireCurrentDirectory.get() || rootPath
            } else {
                searchPath = rootPath + File.separator + '.lib' + File.separator + 'jars'
            }

            const jarPath = searchPath + File.separator + jarName

            classLoadJar(jarPath)
        }

        const loadRuntimeJars = (rootPath, libRootDirectory) => {
            const jarLibDir = Paths.get(libRootDirectory, 'jars').toFile()

            if (jarLibDir.exists()) {
                const jarLibFileNames = Java.from(jarLibDir.listFiles()).filter((file) => {
                    return file.isFile()
                }).map((file) => file.getName())

                if (jarLibFileNames.length) {
                    jarLibFileNames.forEach((libFileName) => {
                        loadJar(rootPath, libFileName)
                    })
                }
            }
        }

        const buildConfigObj = (currDir) => {
            try {
                return Object.freeze(JSON.parse(getFileContent(currDir + '/config.json')));
            } catch (e) {
                return Object.freeze({})
            }
        }

        const init = (args) => {
            const System = Java.type('java.lang.System')
            let startupFileName = ''

            if (args.length > 0) {
                startupFileName = args[0].replace(/\.js$/, '').concat('.js')
            }

            startupFile = new File(startupFileName)
            hasStartupFile = startupFile.exists() && startupFile.isFile()
            // ctx.currDir = hasStartupFile ? startupFile.getAbsoluteFile().getParent() : new File('').getAbsolutePath()
            ctx.currDir = hasStartupFile
                ? startupFile.getParentFile().getCanonicalPath()
                : new File('').getCanonicalPath()

            ctx.rootPath =
                ctx.currDir = ctx.currDir
                    .replace(/\\\.\\/g, '\\')
                    .replace(/\/\/.\//g, '/')
                    .replace(/\.$|\\$|\/$/g, '')

            ctx.libRootDirectory = ctx.rootPath + '/.lib'
            ctx.bitcodesDirectory = ctx.rootPath + '/.lib/bitcodes'
            ctx.config = buildConfigObj(ctx.currDir)

            if (hasStartupFile) {
                loadRuntimeJars(ctx.rootPath, ctx.libRootDirectory)
                loadGlobalBitCodes()
            }
            System.setProperty('thrust.dir', '/mnt/c/work/thrustjs/thrust/src')
            ctx.initialized = true
        }

        if (ctx.initialized === true) {
        } else {
            print(`### [ running init ] => ${arguments[0]} ***************`)
            init(args)
        }

        let env = {
            require,
            currDir: ctx.currDir,
            rootPath: ctx.rootPath,
            libRootDirectory: ctx.libRootDirectory,
            bitcodesDirectory: ctx.bitcodesDirectory,
            loadJar,
            getConfig,
            getBitcodeConfig,
            // config,
            startupFile,
            hasStartupFile,
            // cacheScript: ctx.cacheScript,
            getEnv,
            dangerouslyLoadToGlobal,
            // require,
            _requireCurrentDirectory: ctx._requireCurrentDirectory,
            ...global
        }

        return env
    })(arguments)

    function getFileContent(fullPath) {
        let content = new JString(Files.readAllBytes(Paths.get(fullPath)));

        // return _requireLoaderInterceptorFn.reduce((c, interceptor) => {
        //     return interceptor(fullPath, c);
        // }, content);
        return content
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
        const System = Java.type('java.lang.System')
        const isEmpty = (value) => (value == null || typeof value === 'undefined')
        let value = System.getenv(name)

        return isEmpty(value) ? defaultValue : value
    }

    const resolveWichScriptFileToRequire = (rootPath, bitcodesDirectory, fileName, requireCurrentDirectory) => {
        let moduleName = fileName.replace(/^\.\\|^\.\//, '')
        let moduleDirectory

        if (fileName.startsWith('/')) {
            moduleDirectory = rootPath
        } else if (fileName.startsWith('./') || fileName.startsWith('../')) {
            moduleDirectory = requireCurrentDirectory || rootPath
        } else if (moduleName.indexOf('/') === -1) {
            moduleDirectory = bitcodesDirectory + '/thrust-bitcodes'
        } else {
            moduleDirectory = bitcodesDirectory
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
            throw new Error("Cannot load '" + fileName + "'. Full path: " + resolvedFile)
        }
        // }

        return resolvedFile
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

    const requireCurrentDirectory = ctx._requireCurrentDirectory.get()
    const resolvedFile = resolveWichScriptFileToRequire(env.rootPath, env.bitcodesDirectory, filename, requireCurrentDirectory)
    let result

    if (ctx.cacheScript[resolvedFile] !== undefined) {
        return ctx.cacheScript[resolvedFile]
    }

    const moduleContent = getFileContent(resolvedFile)

    if (resolvedFile.slice(-5) === '.json') {
        return JSON.parse(moduleContent)
    }

    try {
        ctx._requireCurrentDirectory.set(new File(resolvedFile).getAbsoluteFile().getParent().replace(/\.$/, ''))

        // let params = `({require: env.require.bind(${JSON.stringify(env)}),
        let params = `({require,
            getBitcodeConfig: ${env.getBitcodeConfig},
            getConfig: () => { return Object.freeze(${JSON.stringify(env.getConfig())}); },
            rootPath: '${env.rootPath}',
            loadJar: ${env.loadJar},
            getEnv: ${getEnv},
            dangerouslyLoadToGlobal: ${env.dangerouslyLoadToGlobal}
        })`
        let scriptPrefix = `(function({require, getBitcodeConfig, getConfig, rootPath, loadJar, getEnv, dangerouslyLoadToGlobal}) { let exports = {};  let module = {exports}; `
        // let scriptSuffix = `\nreturn exports \n})${params} \n//# sourceURL=${resolvedFile}`
        let scriptSuffix = `\nreturn (exports.constructor.name === 'Object') ? Object.assign(exports, module.exports) : exports \n})${params} \n//# sourceURL=${resolvedFile}`
        let code = scriptPrefix + moduleContent + scriptSuffix
        // print('\n\n' + code + '\n\n')
        // result = Polyglot.eval('js', code)
        ctx.require = require
        result = execScript(env, moduleContent)
        // print('\n===[run]=>>\t' + result.run)
    } finally {
        ctx._requireCurrentDirectory.set(requireCurrentDirectory)
    }

    // print('== result ===> ', JSON.stringify(result, null, 4))
    // print('$$$ typeof $$$ ===>> ' + (typeof result))
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

    ctx.cacheScript[resolvedFile] = (ctx.config && ctx.config.cacheScript) ? result : undefined

    return result
})
    .bind({ cacheScript: {}, _requireCurrentDirectory: new ThreadLocal() })

require((() => {
    const File = Java.type('java.io.File')
    let startupFileName = ''

    if (arguments.length > 0) {
        startupFileName = arguments[0].replace(/\.js$/, '').concat('.js')
    }

    return './' + new File(startupFileName).toString()
})())

// js --jvm --polyglot ../src/th.js -- ./lixo
