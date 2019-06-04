const File = Java.type('java.io.File')
const Paths = Java.type('java.nio.file.Paths')
const Files = Java.type('java.nio.file.Files')
const JString = Java.type('java.lang.String')

const THRUST_LIB_DIR = '.lib/'
const THRUST_BITCODES_DIR = THRUST_LIB_DIR + 'thrust-bitcodes/'
const THRUST_CONFIG_FILE_NAME = 'config.json'
	
const require = (rootPath, currentPath, filePath) => {
	if(currentPath == undefined) {
		throw new Error('Current path cannot be undefined!')
	}
	
	if(filePath == undefined) {
		throw new Error('File path cannot be undefined!')
	}
	
	const scriptCanonicalPath = getFileCanonicalPath(rootPath, currentPath, filePath)
	const scriptDirectory = getFileDirectory(scriptCanonicalPath)
	const scriptContent = getFileContent(scriptCanonicalPath)
	
	const isJSONFile = scriptCanonicalPath.toLowerCase().endsWith('.json')
	
	if(isJSONFile) {
		return JSON.parse(scriptContent)
	}
	
	const encapsulatedUserScriptString = buildEncapsulatedScriptString(scriptContent)
	const bindedRequire = require.bind(null, rootPath, scriptDirectory)
	const configJSON = Object.freeze(JSON.parse(getConfigAsString(rootPath)))
	
	const encapsulatedUserScript = eval(encapsulatedUserScriptString).bind(null, bindedRequire, configJSON, rootPath, scriptDirectory)
	
	return encapsulatedUserScript.call({})
}

//"expose" function to enabled Java to call "invokeMember"
({
	require
})

/* "private" functions */
const getFileCanonicalPath = (rootPath, currentPath, filePath) => {
	let canonicalFilePath
	
	if(filePath.startsWith('.')) {
		canonicalFilePath = currentPath + '/' + filePath;
	} else if(filePath.startsWith("/")) {
		canonicalFilePath =  filePath;
	} else {
		canonicalFilePath =  rootPath + '/' + THRUST_BITCODES_DIR + filePath;
	}
	
	let file = new File(canonicalFilePath)
	
	if(file.isDirectory()) {
		canonicalFilePath += "/index.js";
	} else {
		let newCanonicalPath = canonicalFilePath
		
		if(!file.exists()) {
			newCanonicalPath = canonicalFilePath + '.js'
			file = new File(newCanonicalPath)
		}
		
		if(!file.exists()) {
			newCanonicalPath = canonicalFilePath + '.json'
			file = new File(newCanonicalPath)
		}
		
		if(!file.exists()) {
			throw Error(`Could not found '${canonicalFilePath}'`)
		}
		
		canonicalFilePath = newCanonicalPath
	}
	
	return new File(canonicalFilePath).getCanonicalPath()
}

const getFileContent = (canonicalFilePath) => new JString(Files.readAllBytes(Paths.get(new File(canonicalFilePath).getCanonicalPath())))

const getFileDirectory = (canonicalFilePath) => new JString(new File(canonicalFilePath).getParent())

const buildEncapsulatedScriptString = userScriptContent => `(() => function (require, __CONFIG__, __ROOT_DIR__, __CURRENT_DIR__) {
	let exports = {}
	
	${userScriptContent}
	
	return exports
}.bind({}))()`

const getConfigAsString = rootPath => {
	try {
		return new JString(Files.readAllBytes(Paths.get(rootPath + '/' + THRUST_CONFIG_FILE_NAME)))
	} catch (e) {
		return '{}'
	}
}
