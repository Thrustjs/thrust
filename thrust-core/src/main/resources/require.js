const File = Java.type('java.io.File')
const Paths = Java.type('java.nio.file.Paths')
const Files = Java.type('java.nio.file.Files')
const JString = Java.type('java.lang.String')
const Thrust = Java.type('br.com.softbox.thrust.core.Thrust')

const THRUST_LIB_DIR = '.lib'
const THRUST_BITCODES_DIR = Paths.get(THRUST_LIB_DIR, 'bitcodes').toString()
const THRUST_CONFIG_FILE_NAME = 'config.json'
const rootPath = '<rootPath>'

let moduleCache = {}

let interceptor = (_, content) => content
const addInterceptor = (newInterceptor) => {
    if (typeof newInterceptor === 'function') {
        interceptor = newInterceptor
    } else {
        console.log('Invalid interceptor:', newInterceptor)
        try {
            throw new Error()
        } catch (e) {
            console.log('trace', e.stack)
        }
    }
}

function evalModule(scriptContent, scriptCanonicalPath, scriptCanonicalDirectory, requireFunction) {
    const relativePath = scriptCanonicalPath.replace(rootPath.replace('/.', '/'), '')
    // Declaracao das variaveis de escopo do require
    let exports = {}
    const __THRUST_VERSION__ = Thrust.VERSION
    const __ROOT_DIR__ = rootPath
    const __CURRENT_DIR__ = scriptCanonicalDirectory
    const getConfig = () => Object.freeze(JSON.parse(getConfigAsString()))
    const require = requireFunction.bind(this, scriptCanonicalDirectory, requireFunction)
    require.addInterceptor = addInterceptor
    eval(interceptor(relativePath, scriptContent + '//@ sourceURL=' + relativePath))
    return exports
}

const require = (...args) => {
    const currentPath = args.length === 1 ? undefined : args[0]
    const requireFunction = args.length === 1 ? require : args[1]
    const filePath = args.length === 1 ? args[0] : args[2]

    if (!filePath) {
        throw new Error('File path is empty')
    }
    const scriptCanonicalPath = getFileCanonicalPath(rootPath, filePath, currentPath)
    let cache = moduleCache[scriptCanonicalPath]
    if (cache) {
        return cache
    }
    const scriptCanonicalDirectory = getFileDirectory(scriptCanonicalPath)
    const scriptContent = getFileContent(scriptCanonicalPath)
    const isJSONFile = scriptCanonicalPath.toLowerCase().endsWith('.json')
    if (isJSONFile) {
        return JSON.parse(scriptContent)
    }
    cache = evalModule.call({}, scriptContent, scriptCanonicalPath, scriptCanonicalDirectory, requireFunction)
    moduleCache[scriptCanonicalPath] = cache
    return cache
}

// "expose" function to enabled Java to call "invokeMember"
({
    require
})

const searchPathReduce = (returnPath, path) => {
    if (!returnPath && path.exists()) {
        returnPath = path.getAbsolutePath()
    }
    return returnPath
}

const getCanonicalFilePath = (rootPath, filePath, currentPath) => {
    if (filePath.startsWith('.')) {
        return (currentPath || rootPath) + '/' + filePath
    }
    if (filePath.startsWith('/')) {
        return filePath
    }
    const pathsForFilePath = [
        Paths.get(rootPath, THRUST_BITCODES_DIR, filePath).toFile(),
        Paths.get(rootPath, THRUST_BITCODES_DIR, filePath + '.js').toFile(),
        Paths.get(rootPath, THRUST_BITCODES_DIR, 'thrust-bitcodes', filePath).toFile(),
        Paths.get(rootPath, THRUST_BITCODES_DIR, 'thrust-bitcodes', filePath + '.js').toFile()
    ]
    return pathsForFilePath.reduce(searchPathReduce, null) || `${rootPath}/${THRUST_BITCODES_DIR}/thrust-bitcodes/${filePath}`
}

/* "private" functions */
const getFileCanonicalPath = (rootPath, filePath, currentPath) => {
    let canonicalFilePath = getCanonicalFilePath(rootPath, filePath, currentPath)

    let file = new File(canonicalFilePath)
    if (file.isDirectory()) {
        canonicalFilePath += '/index.js'
    } else {
        let newCanonicalPath = canonicalFilePath

        if (!file.exists()) {
            newCanonicalPath = canonicalFilePath + '.js'
            file = new File(newCanonicalPath)
        }

        if (!file.exists()) {
            newCanonicalPath = canonicalFilePath + '.json'
            file = new File(newCanonicalPath)
        }

        if (!file.exists()) {
            throw Error(`Could not found '${canonicalFilePath}'`)
        }

        canonicalFilePath = newCanonicalPath
    }
    return new File(canonicalFilePath).getCanonicalPath()
}

const getFileContent = (canonicalFilePath) => new JString(Files.readAllBytes(Paths.get(new File(canonicalFilePath).getCanonicalPath())))

const getFileDirectory = (canonicalFilePath) => new JString(new File(canonicalFilePath).getParent())

const getConfigAsString = () => {
    try {
        return new JString(Files.readAllBytes(Paths.get(rootPath + '/' + THRUST_CONFIG_FILE_NAME)))
    } catch (_) {
        return '{}'
    }
}
