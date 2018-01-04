package br.com.softbox.thrust.core;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import javax.script.Bindings;
import javax.script.Invocable;
import javax.script.ScriptContext;
import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import javax.script.ScriptException;
import javax.script.SimpleBindings;
import javax.script.SimpleScriptContext;

import br.com.softbox.thrust.util.ThrustUtils;
import jdk.nashorn.api.scripting.JSObject;
import jdk.nashorn.api.scripting.ScriptObjectMirror;

public class ThrustCore {
	private static ScriptEngine engine;
	private static ScriptContext rootContext;
	private static Bindings rootScope;
	
	private static String rootPath;
	
	@SuppressWarnings("restriction")
	private static JSObject config;
	
	private static boolean transpileScripts = false;
	private static Map<String, ScriptInfo> scriptCache = new HashMap<String, ScriptInfo>();
	
	private static final String LIB_PATH = "lib";
	
	static {
		System.setProperty("nashorn.args", "--language=es6");
		
		engine = new ScriptEngineManager().getEngineByName("nashorn");
		rootContext = engine.getContext();
		rootScope = rootContext.getBindings(ScriptContext.ENGINE_SCOPE);
		rootPath = new File("").getAbsolutePath();
	}
	
	public ThrustCore() throws ScriptException, IOException, NoSuchMethodException {
		initialize();
	}
	
	public ThrustCore(String applicationName) throws ScriptException, IOException, NoSuchMethodException {
		String thrustDirectory = System.getProperty("thrust.root.path");
		if(thrustDirectory == null || "".equals(thrustDirectory)) {
			throw new IllegalStateException("[ERROR] System property \"thrust.root.path\" not set. Please, define it.");
		}
		
		rootPath = thrustDirectory + File.separator + applicationName;
		validateRootPath();
		initialize();
	}
	
	@SuppressWarnings("restriction")
	private void initialize() throws ScriptException, IOException, NoSuchMethodException {
		ThrustUtils.loadRequireWrapper(engine, rootContext);
		ThrustUtils.loadGetConfigFunction(rootPath, engine, rootContext);
		
		readConfig();
		
		Object transpile = config.getMember("transpileScripts");
		if(transpile instanceof Boolean) {
			transpileScripts = (boolean) transpile;
		}
		
		if(transpileScripts != false) {
			requireBabelToGlobal();
		}
		
		requireGlobalBitCodesByConfig();
	}
	
	private void readConfig() throws NoSuchMethodException, ScriptException {
		config = invokeFunction("getConfig");
	}
	
	@SuppressWarnings("restriction")
	private void requireGlobalBitCodesByConfig() throws ScriptException, IOException {
		Object bitCodeNamesObject = config.getMember("loadToGlobal");
		
		if(bitCodeNamesObject instanceof jdk.nashorn.internal.runtime.Undefined) {
			return;
		}
		
		List<String> bitCodeNames = new ArrayList<String>();
		
		if(bitCodeNamesObject instanceof String) {
			bitCodeNames.add((String) bitCodeNamesObject);
		} else {
			for(Map.Entry<String, Object> entry : ((ScriptObjectMirror) bitCodeNamesObject).entrySet()) {
				bitCodeNames.add((String) entry.getValue());
			}
		}
		
		for(String bitCodeName : bitCodeNames) {
			bitCodeName = bitCodeName.trim();
			String bitCodeFileName = bitCodeName.startsWith(LIB_PATH + "/") ? bitCodeName : LIB_PATH + "/" + bitCodeName;
			bitCodeFileName = bitCodeFileName.endsWith(".js") ? bitCodeFileName : bitCodeFileName + ".js";
			
			int firstIndexToSearch = bitCodeName.lastIndexOf('/') > -1 ? bitCodeName.lastIndexOf('/') : 0;
			bitCodeName = bitCodeName.replaceAll(".js", "").substring(firstIndexToSearch, bitCodeName.length());
			
			engine.eval("var " + bitCodeName + " = require('" + bitCodeFileName + "')", rootContext);
		}
	}
	
	private void requireBabelToGlobal() throws ScriptException, IOException {
		//ClassLoader classLoader = getClass().getClassLoader();
		InputStream in = getClass().getResourceAsStream("/babel.min.js"); 
		BufferedReader reader = new BufferedReader(new InputStreamReader(in));
		String babelStr = reader.lines().collect(Collectors.joining());
		engine.eval("var babelString = '" + babelStr + "'; eval(babelString);");
	}
	
	@SuppressWarnings("restriction")
	public JSObject eval(String expression) throws ScriptException {
		ScriptContext reqContext = new SimpleScriptContext();
        Bindings reqScope = new SimpleBindings();

        reqScope.putAll(rootScope);
        reqContext.setBindings(reqScope, ScriptContext.ENGINE_SCOPE);
        reqScope.put("reqContext", reqContext);

		setupContext(reqContext);
		
		JSObject result = null;
		try {
			result = (JSObject) engine.eval(expression, reqContext);
		} catch(ClassCastException ignored) { }
		
		return result;
	}
	
	@SuppressWarnings("restriction")
	public JSObject invokeFunction(String function, Object... params) throws NoSuchMethodException, ScriptException {
		Invocable inv = (Invocable) engine;
		String[] fullPath = function.split("\\.");
		
		if(fullPath.length == 1) {
			return (JSObject) inv.invokeFunction(function, params);
		}
		
		ScriptObjectMirror scriptObjectMirror = (ScriptObjectMirror) rootScope.get(fullPath[0]);
		int i = 1;
		for(;i < (fullPath.length - 1); i++) {
			scriptObjectMirror = (ScriptObjectMirror) scriptObjectMirror.get(fullPath[i]);
		}
		
		JSObject result = null;
		try {
			result = (JSObject) scriptObjectMirror.callMember(fullPath[i], params);
		} catch(ClassCastException ignored) { }
		
		return result;
	}
	
//	@SuppressWarnings("restriction")
//	public static ScriptObjectMirror require(String fileName, boolean loadToGlobal) {
//		ScriptObjectMirror scriptObject = null;
//		
//		loadToGlobal = true;
//		
//		try {
//			String fileNameNormalized = fileName.endsWith(".js") ? fileName : fileName.concat(".js");
//			String scriptPath = rootPath + File.separator + fileNameNormalized;
//			File scriptFile = new File(scriptPath);
//			String scriptContent = null;
//			
//			/*Cache control mechanism*/
//			if(scriptCache.containsKey(scriptPath) && scriptCache.get(scriptPath).getLoadTime() >= scriptFile.lastModified()) {
//				scriptContent = scriptCache.get(scriptPath).getContent();
//			} else {
//				scriptContent = new String(Files.readAllBytes(scriptFile.toPath()), StandardCharsets.UTF_8);
//				updateScriptCache(scriptFile, scriptContent);
//			}
//			
//			if(loadToGlobal) {
//				scriptObject = (ScriptObjectMirror) engine.eval(scriptContent, rootContext);
//			} else {
//				
//				Bindings reqScope = new SimpleBindings();
//				reqScope.putAll(engine.getContext().getBindings(ScriptContext.ENGINE_SCOPE));
//				
//				ScriptContext reqContext = new SimpleScriptContext();
//				reqContext.setBindings(reqScope, ScriptContext.ENGINE_SCOPE);
//				
//				setupContext(reqContext);
//				
//				if(transpileScripts) {
//					//TODO: O código abaixo não executa o index.js, por conta da falta de ; antes do exports
//					if(rootContext.getAttribute("Babel") != null) {
//						scriptContent = "Babel.transform(\"" + scriptContent.replaceAll("\n", " \t\\\\\n").replaceAll("\\\"", "\\\\\"") + "\", {presets:  [ [\"es2015\"] ]} ).code.replace('\"use strict\";', '')";
//						scriptContent = (String) engine.eval(scriptContent, reqContext);
//					}
//				}
//				
//				if(scriptContent != null) {
//					Object result = engine.eval(scriptContent, reqContext);
//					if(result instanceof ScriptObjectMirror) {
//						scriptObject = (ScriptObjectMirror) result;
//					}
//				}
//				
//				//TODO: gravar em arquivo o conteúdo transpilado
//				updateScriptCache(scriptFile, scriptContent);
//			}
//		} catch(IOException e) {
//			System.out.println("[ERROR] Cannot load " + fileName + " module.");
//			e.printStackTrace();
//		} catch(ScriptException se) {
//			System.out.println("[ERROR] Error running module code: " + fileName + ".");
//			se.printStackTrace();
//		}
//		
//		return scriptObject;
//	}
	
	public static String require(String fileName) throws Exception {
		String scriptContent = null;
		
		try {
			String fileNameNormalized = fileName.endsWith(".js") ? fileName : fileName.concat(".js");
			String scriptPath = rootPath + File.separator + fileNameNormalized;
			File scriptFile = new File(scriptPath);
			
			if(scriptCache.containsKey(scriptPath) && scriptCache.get(scriptPath).getLoadTime() >= scriptFile.lastModified()) {
				scriptContent = scriptCache.get(scriptPath).getContent();
			} else {
				scriptContent = new String(Files.readAllBytes(scriptFile.toPath()), StandardCharsets.UTF_8);
				
				if(transpileScripts) {
					//TODO: O código abaixo não executa o index.js, por conta da falta de ; antes do exports
					if(rootContext.getAttribute("Babel") != null) {
						scriptContent = "Babel.transform(\"" + scriptContent.replaceAll("\n", " \t\\\\\n").replaceAll("\\\"", "\\\\\"") + "\", {presets:  [ [\"es2015\"] ]} ).code.replace('\"use strict\";', '')";
						scriptContent = (String) engine.eval(scriptContent, rootContext);
					}
				}

				updateScriptCache(scriptFile, scriptContent);
			}
		} catch(IOException e) {
			System.out.println("[ERROR] Cannot load " + fileName + " module.");
			e.printStackTrace();
		}
		
		return scriptContent;
	}
	
	private static void updateScriptCache(File scriptFile, String scriptContent) {
		if(!scriptCache.containsKey(scriptFile.getAbsolutePath())) {
			ScriptInfo scriptInfo = new ScriptInfo(scriptContent, new Date().getTime());
			scriptCache.put(scriptFile.getAbsolutePath(), scriptInfo);
		} else {
			ScriptInfo scriptInfo = scriptCache.get(scriptFile.getAbsolutePath());
			scriptInfo.setContent(scriptContent);
		}
	}
	
	private static void validateRootPath() {
		File file = new File(rootPath);
		if(!file.exists()) {
			throw new IllegalStateException("[ERROR] Invalid rootPath: \"" + rootPath + "\".");
		}
	}

	private static void setupContext(ScriptContext context) throws ScriptException {
		ThrustUtils.loadPolyfills(engine, context);
	}
}
