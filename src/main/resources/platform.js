var ThreadLocal = Java.type("java.lang.ThreadLocal");
var JString = Java.type("java.lang.String");
var Class = Java.type("java.lang.Class");
var ClassLoader = Java.type("java.lang.ClassLoader");
var URL = Java.type("java.net.URL");
var URLClassLoader = Java.type("java.net.URLClassLoader");
var File = Java.type("java.io.File");
var BufferedReader = Java.type("java.io.BufferedReader");
var InputStreamReader = Java.type("java.io.InputStreamReader");
var StandardCharsets = Java.type("java.nio.charset.StandardCharsets");
var Files = Java.type("java.nio.file.Files");
var Paths = Java.type("java.nio.file.Paths");
var Collectors = Java.type("java.util.stream.Collectors");

var ThrustCore = Java.type("br.com.softbox.thrust.core.ThrustCore");

//Essa variável é usada para controlar o path atual do require, para que seja possível
//fazer require de "./" dentro de um bitcode por exemplo.
var _currentRequireDir = new ThreadLocal();

var _scriptCache = Object.create(null);

var _config;
var _self = this;

init();

function init() {
	requireGlobalBitCodesByConfig();
	
	if(getConfig().transpileScripts) {
		//requireBabelToGlobal();
	}
}

function require(fileName, strictRequire) {
	return (function() {
		var exports = {};
		var attrs = {};

		var scriptContent = getScriptContent(fileName, strictRequire);
		var map = eval(scriptContent);
		
		for (var key in map) {
			if(key !== "module") {
				attrs[key] = map[key];
			} else {
				for(var exportsKey in map[key].exports) {
					attrs[exportsKey] = map[key[exportsKey]];
				}
			} 
		}

		return attrs;
	})();
}

function getScriptContent(fileName, strictRequire) {
	var scriptContent = null;
	
	try {
		var relativeRequire = fileName.startsWith("./") || fileName.startsWith("../");
		
		var possibleFileNames = [];
		
		if (fileName.endsWith(".js")) {
			possibleFileNames.push(fileName);
		} else {
			if (!strictRequire) {
				possibleFileNames.push(fileName + File.separator + "index.js");
			}
			
			possibleFileNames.push(fileName.concat(".js"));
		}
		
		var possiblePaths = [];
		
		if (strictRequire) {
			possiblePaths.push(rootPath);
		} else {
			var currentDir = _currentRequireDir.get();
			
			if (currentDir != null && !rootPath.equals(currentDir)) {
				possiblePaths.push(currentDir);	
			}
			
			if (relativeRequire) {
				possiblePaths.push(rootPath);
			} else {
				possiblePaths.push(rootPath + File.separator + ThrustCore.LIB_PATH);
			}
		}
		
		outer: for each(var basePath in possiblePaths) {
			for each(var possibleName in possibleFileNames) {
				var scriptPath = basePath + File.separator + possibleName;
				var scriptFile = new File(scriptPath);
				
				var scriptInfo = _scriptCache[scriptFile.getAbsolutePath()];
				
				if (scriptInfo && scriptInfo.loadTime > scriptFile.lastModified()) {
					scriptContent = scriptInfo.scriptContent;
				} else if (scriptFile.exists()){
					scriptContent = new JString(Files.readAllBytes(scriptFile.toPath()), StandardCharsets.UTF_8);
					
					if (getConfig().transpileScripts) {
						//TODO: O código abaixo não executa o index.js, por conta da falta de ; antes do exports
						//scriptContent = "Babel.transform(\"" + scriptContent.replaceAll("\n", " \t\\\\\n").replaceAll("\\\"", "\\\\\"") + "\", {presets:  [ [\"es2015\"] ]} ).code.replace('\"use strict\";', '')";
					}
					
					updateScriptCache(scriptFile, scriptContent);
				}
			
				if (scriptContent != null) {
					_currentRequireDir.set(scriptFile.getParent());
					break outer;
				}
			}
		}
		
		if (!scriptContent) {
			throw new Error("[ERROR] Cannot find " + fileName + " module.")
		}
	} catch(e) {
		print("[ERROR] Cannot load " + fileName + " module.");
		print(e);
	}
	
	return scriptContent;
}

function loadJar(jarName) {
	var searchPath = _currentRequireDir.get();
	
	if (searchPath == null) {
		searchPath = rootPath;
	}
	
	try {
		var jarFile = new File(searchPath + File.separator + jarName);
		
		if (jarFile.exists()) {
			var method = URLClassLoader.class.getDeclaredMethod("addURL", [URL.class]);

			method.setAccessible(true);
		    method.invoke(ClassLoader.getSystemClassLoader(), [jarFile.toURI().toURL()]);
		}
	} catch (e) {
		throw new Error("[ERROR] Cannot load .jar: " + jarName);
	}
}

function updateScriptCache(scriptFile, scriptContent) {
	var scriptInfo = _scriptCache[scriptFile.getAbsolutePath()];
	
	if (!scriptInfo) {
		scriptInfo = {
			scriptContent: scriptContent,
			loadTime: Date.now()
		};
		
		_scriptCache[scriptFile.getAbsolutePath()] = scriptInfo;
	} else {
		scriptInfo.scriptContent = scriptContent;
	}
}

function requireGlobalBitCodesByConfig() {
	var bitCodeNames = getConfig().loadToGlobal;
	
	if (bitCodeNames) {
		var bitList = [];
		
		if (typeof bitCodeNames == 'string') {
			bitList.push(bitCodeNames);
		} else if(Array.isArray(bitCodeNames)) {
			bitCodeNames.forEach(function(name) {
				bitList.push(name);
			});
		}
		
		bitList.forEach(function(bitCodeName) {
			bitCodeName = bitCodeName.trim();
			
			var bitCodeFileName = bitCodeName.endsWith(".js") ? bitCodeName : bitCodeName + ".js";
			var firstIndexToSearch = bitCodeName.lastIndexOf('/') > -1 ? bitCodeName.lastIndexOf('/') : 0;
			
			bitCodeName = bitCodeName.replaceAll(".js", "").substring(firstIndexToSearch, bitCodeName.length());
			
			_self[bitCodeName] = require(bitCodeFileName);
		});
	}
}

function requireBabelToGlobal() {
	var inStream = ThrustCore.class.getResourceAsStream("/babel.min.js");
	var reader = new BufferedReader(new InputStreamReader(inStream));
	var babelStr = reader.lines().collect(Collectors.joining());
	
	engine.eval("var babelString = '" + babelStr + "'; eval(babelString);");
}
	
function getConfig() {
	if (!_config) {
		var configJson = new File(rootPath + File.separator + "config.json");
		
		if (configJson.exists()) {
			_config = readJson(configJson.getPath());
		} else {
			_config = {};
		}
	}
	
	return _config;
}

function readJson(filePathName, charSet) {
    var content = null;
    var cs = charSet || StandardCharsets.UTF_8;

    try {        
        content = new JString(Files.readAllBytes(Paths.get(filePathName)), cs);
    } catch (e) {
        throw 'Unable to read file at: ' + filePathName + ', ' + e
    }
    return JSON.parse(content);
}

