package br.com.softbox.thrust.core;

import java.io.BufferedReader;
import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.lang.reflect.Method;
import java.net.URL;
import java.net.URLClassLoader;
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
	
	private static final ThreadLocal<String> tlCurrentDir = new ThreadLocal<String>();
	
	private static final Method addToClassLoaderMethod;
	
	static {
		System.setProperty("nashorn.args", "--language=es6");
		
		engine = new ScriptEngineManager().getEngineByName("nashorn");
		rootContext = engine.getContext();
		rootScope = rootContext.getBindings(ScriptContext.ENGINE_SCOPE);
		rootPath = new File("").getAbsolutePath();
		
		try {
			addToClassLoaderMethod = URLClassLoader.class.getDeclaredMethod("addURL", new Class<?>[] {URL.class});
			addToClassLoaderMethod.setAccessible(true);
		} catch (Exception e) {
			throw new IllegalArgumentException("[ERROR] Cannot get 'addURL' method from URLClassLoader");
		}
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
		ThrustUtils.loadJarWrapper(engine, rootContext);
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
	
	public void loadScript(String fileName) throws Exception {
        require(fileName, true);
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
			String bitCodeFileName = bitCodeName.endsWith(".js") ? bitCodeName : bitCodeName + ".js";
			
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
		
	public static String require(String fileName, boolean strictRequire) throws Exception {
		String scriptContent = null;
		
		try {
			boolean relativeRequire = fileName.startsWith("./") || fileName.startsWith("../");
			
			List<String> possibleFileNames = new ArrayList<String>();
			
			if (fileName.endsWith(".js")) {
				possibleFileNames.add(fileName);
			} else {

				if (!strictRequire) {
					possibleFileNames.add(fileName + File.separator + "index.js");
				}
				
				possibleFileNames.add(fileName.concat(".js"));
			}
			
			List<String> possiblePaths = new ArrayList<String>();
			
			if (strictRequire) {
				possiblePaths.add(rootPath);
			} else {
				String currentDir = tlCurrentDir.get();
				
				if (currentDir != null && !rootPath.equals(currentDir)) {
					possiblePaths.add(currentDir);	
				}
				
				if (relativeRequire) {
					possiblePaths.add(rootPath);
				} else {
					possiblePaths.add(rootPath + File.separator + LIB_PATH);
				}
			}
			
			String scriptPath = null;
			File scriptFile = null;
			ScriptInfo scriptInfo = null;
			
			outer: for (String basePath : possiblePaths) {
				for (String possibleName : possibleFileNames) {
					scriptPath = basePath + File.separator + possibleName;
					scriptFile = new File(scriptPath);
				
					scriptInfo = scriptCache.get(scriptPath);
					
					if (scriptInfo != null && scriptInfo.getLoadTime() > scriptFile.lastModified()) {
						scriptContent = scriptInfo.getContent();
					} else if (scriptFile.exists()){
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
				
					if (scriptContent != null) {
						tlCurrentDir.set(scriptFile.getParent());
						break outer;
					}
				}
			}
		
			if (scriptContent == null) {
				throw new IllegalArgumentException("[ERROR] Cannot find " + fileName + " module.");
			}
		} catch(IOException e) {
			System.out.println("[ERROR] Cannot load " + fileName + " module.");
			e.printStackTrace();
		}
		
		return scriptContent;
	}
	
	public static void loadJar(String jarName) {
		String searchPath = tlCurrentDir.get();
		
		if (searchPath == null) {
			searchPath = rootPath;
		}
		
		try {
			File jarFile = new File(searchPath + File.separator + jarName);
			
			if (jarFile.exists()) {
				addToClassLoaderMethod.invoke(ClassLoader.getSystemClassLoader(), jarFile.toURI().toURL());
			}
		} catch (Exception e) {
			throw new IllegalArgumentException("[ERROR] Cannot load .jar: " + jarName);
		}
	}
	
	private static void updateScriptCache(File scriptFile, String scriptContent) {
		ScriptInfo scriptInfo = scriptCache.get(scriptFile.getAbsolutePath());
		
		if (scriptInfo == null) {
			scriptInfo = new ScriptInfo(scriptContent, new Date().getTime(), scriptFile);
			scriptCache.put(scriptFile.getAbsolutePath(), scriptInfo);
		} else {
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
