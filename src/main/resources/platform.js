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

var DEF_BITCODES_OWNER = "thrust-bitcodes"

var LIB_PATH = ".lib"

// Essa variável é usada para controlar o path atual do require, para que seja possível
// fazer require de "./" dentro de um bitcode por exemplo.
var _currentRequireCaller = new ThreadLocal();

var _scriptCache = Object.create(null);

var _config;
var _self = this;

init();

function init() {
  loadRuntimeJars()
  requireGlobalBitCodesByConfig()

  if (getConfig().transpileScripts) {
    //requireBabelToGlobal();
  }
}

/**
* Usado para carregar um módulo, que pode ser um arquivo ou bitcode
* @param   {String} fileName - Nome do recurso a ser carregado.
*   Caso seja passado um caminho relativo (./ ou ../) o módulo será carregado
*   com caminho relativo ao script que originou a chamada.
*
*   Caso seja passado um caminho iniciando com '/', consideramos o require
*   a partir do diretório root
*
*   Caso seja passado um nome, assumimos que é um require de bitcode,
*   sendo assim pesquisamos pelos bitcodes instalados.
*   O require de bitcodes, é feito com 'owner/bitcode', sendo que owner
*   é opcional e caso não informado será carregado um bitcode oficial,
*   'thrust-bitcodes/bitcode'
*
*   O algoritmo de require sempre pesquisa por 'NomeDoModulo/index.js'
*   ou 'NomeDoModulo.js', nesta ordem.
*
* @returns {Object} Retorna o modulo carregado
* @code require('database')
* @code require('ownerNaoOficial/database')
* @code require('./teste')
*/
function require(fileName) {
  return (function () {
    var currentRequireCaller = _currentRequireCaller.get();

    try {
      var scriptInfo = _scriptCache[fileName]

      if (!scriptInfo || getConfig().developmentMode === true || getConfig().cacheScript === false || scriptInfo.isModified()) {
        exports = {}
        var module = {
          exports: exports
        }

        scriptInfo = getScriptInfo(fileName)

        try {
        	eval(scriptInfo.scriptContent)
        } catch(e) {
        	let requireCaller = _currentRequireCaller.get();
        	requireCaller = requireCaller && requireCaller.getAbsolutePath()

        	if (!requireCaller) {
        		requireCaller = rootPath
        	}

        	print('[ERROR] An error was throw executing: ' + requireCaller)

        	throw e
        }

        if (exports !== module.exports) {
          for (var att in module.exports) {
            exports[att] = module.exports[att]
          }
        }

        scriptInfo.exports = exports
        _scriptCache[fileName] = scriptInfo
      }

      return exports
    } catch(e) {
    	print(e)
    } finally {
      _currentRequireCaller.set(currentRequireCaller)
    }

  })()
}

function getScriptInfo(fileName) {
  let scriptFile;
  let scriptContent;

  var relativeRequire = fileName.startsWith("./") || fileName.startsWith("../")
  var relativeToRootRequire = fileName.startsWith("/")

  var possibleFileNames = [];
  var possiblePaths = [];

  var currentRequireCaller = _currentRequireCaller.get();
  var currentDir = currentRequireCaller && currentRequireCaller.getParent()

  if (fileName.endsWith(".js")) {
    possibleFileNames.push(fileName);
  } else {
    if (fileName.indexOf('/') < 0) {
      fileName = DEF_BITCODES_OWNER + "/" + fileName;
    }

    possibleFileNames.push(fileName + File.separator + "index.js");

    possibleFileNames.push(fileName.concat(".js"));
  }

  if (relativeToRootRequire) {
    possiblePaths.push(rootPath);
  } else {
    if (currentDir != null && !rootPath.equals(currentDir)) {
      possiblePaths.push(currentDir);
    }

    if (relativeRequire) {
      possiblePaths.push(rootPath);
    } else {
      possiblePaths.push(rootPath + File.separator + LIB_PATH + File.separator + "bitcodes");
    }
  }

  possiblePaths.every(function (basePath) {
    return possibleFileNames.every(function (possibleName) {
      var scriptPath = basePath + File.separator + possibleName

      scriptFile = new File(scriptPath)

      if (scriptFile.exists()) {
        scriptContent = new JString(Files.readAllBytes(scriptFile.toPath()), StandardCharsets.UTF_8)

        if (getConfig().transpileScripts) {
          //TODO: O código abaixo não executa o index.js, por conta da falta de ; antes do exports
          //scriptContent = "Babel.transform(\"" + scriptContent.replaceAll("\n", " \t\\\\\n").replaceAll("\\\"", "\\\\\"") + "\", {presets:  [ [\"es2015\"] ]} ).code.replace('\"use strict\";', '')";
        }
      }

      if (scriptContent) {
        _currentRequireCaller.set(scriptFile)
        return false
      }

      return true
    })
  })

  if (!scriptContent) {
    let currPath = _currentRequireCaller.get()

    if (currPath) {
      currPath = currPath.getAbsolutePath()
    } else {
      currPath = rootPath
    }

    throw new Error("Cannot load '" + fileName + "' module in path:" + currPath)
  }

  return {
	  scriptContent: scriptContent,
	  scriptFile: scriptFile,
	  lastModified: scriptFile.lastModified(),
	  isModified: function() {
		  return this.scriptFile.lastModified() > this.lastModified
	  }
  };
}

/**
* Usado para carregar um jar para o Classpath da aplicação.
* @param {String} jarName - Nome do jar a ser carregado.
*   Caso seja passado um caminho relativo (./ ou ../) o módulo será carregado
*   com caminho relativo ao script que originou a chamada.
*
*   Caso seja passado um nome, assumimos que é um require de dependencia de um bitcode,
*   sendo assim pesquisamos pelos jars dos bitcodes instalados.
*
* @code loadJar('./vendor/meuJar.jar')
*/
function loadJar(jarName) {
  var searchPath

  if (jarName.startsWith("./") || jarName.startsWith("../")) {
    searchPath = _currentRequireCaller.get();
    searchPath = searchPath && searchPath.getAbsolutePath()

    if (searchPath == null) {
      searchPath = rootPath;
    }
  } else {
    searchPath = rootPath + File.separator + LIB_PATH + File.separator + "jars"
  }

  var jarPath = searchPath + File.separator + jarName

  try {
    var jarFile = new File(jarPath);

    if (jarFile.exists()) {
      var method = URLClassLoader.class.getDeclaredMethod("addURL", [URL.class]);

      method.setAccessible(true);
      method.invoke(ClassLoader.getSystemClassLoader(), [jarFile.toURI().toURL()]);
    } else {
      throw new Error("File not found");
    }
  } catch (e) {
    throw new Error("[ERROR] Cannot load jar '" + jarPath + "': " + e.message);
  }
}

function requireGlobalBitCodesByConfig() {
  var bitCodeNames = getConfig().loadToGlobal

  if (bitCodeNames) {
    var bitList = []

    if (typeof bitCodeNames == 'string') {
      bitList.push(bitCodeNames)
    } else if (Array.isArray(bitCodeNames)) {
      bitCodeNames.forEach(function (name) {
        bitList.push(name)
      })
    }

    bitList.forEach(function (bitCodeName) {
      bitCodeName = bitCodeName.trim()

      var firstIndexToSearch = bitCodeName.lastIndexOf('/') > -1 ? bitCodeName.lastIndexOf('/') + 1 : 0
      var bitCodeExportName = bitCodeName.substring(firstIndexToSearch, bitCodeName.length())

      loadToGlobal(bitCodeExportName, require(bitCodeName))
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
function loadToGlobal(name, obj) {
  _self[name] = obj
}

function loadRuntimeJars() {
  var jarLibDir = Paths.get(rootPath, LIB_PATH, "jars").toFile()

  if (jarLibDir.exists()) {
    Java.from(jarLibDir.listFiles()).forEach(function (libFile) {
      if (libFile.isFile()) {
        loadJar(libFile.getName())
      }
    })
  }
}

function requireBabelToGlobal() {
  var inStream = ThrustCore.class.getResourceAsStream("/babel.min.js");
  var reader = new BufferedReader(new InputStreamReader(inStream));
  var babelStr = reader.lines().collect(Collectors.joining());

  engine.eval("var babelString = '" + babelStr + "'; eval(babelString);");
}

/**
* Usado para pegar o JSON de configuração (config.json)
* @code getConfig().minhaVar
*/
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
  var config = getConfig()[bitcode] || {}

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
