package br.com.softbox.thrust.core;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;

import javax.script.Bindings;
import javax.script.Invocable;
import javax.script.ScriptContext;
import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import javax.script.ScriptException;
import javax.script.SimpleBindings;
import javax.script.SimpleScriptContext;

import br.com.softbox.thrust.util.ThrustUtils;
import jdk.nashorn.api.scripting.*;

public class ThrustCore {
	private static ScriptEngine engine;
	private static ScriptContext rootContext;
	private static Bindings rootScope;
	
	static {
		System.setProperty("nashorn.args", "--language=es6");
		
		engine = new ScriptEngineManager().getEngineByName("nashorn");
		rootContext = engine.getContext();
		rootScope = rootContext.getBindings(ScriptContext.ENGINE_SCOPE);
	}
	
	public ThrustCore() throws ScriptException, IOException {
		ThrustUtils.loadRequireWrapper(engine, rootContext);
		ThrustUtils.loadConfig(engine, rootContext);
		loadGlobalBitCodesByConfig();
		
		//Injeção manual de um objeto 'http' com a função 'service' para testes
		//engine.eval("var http = {service: function(n1, n2) { print('Param 1: ' + n1 + '\\nParam2: ' + n2) } }");
	}
	
	public void loadScript(String fileName) throws IOException, ScriptException {
        require(fileName, false);
    }
	
	@SuppressWarnings("restriction")
	private void loadGlobalBitCodesByConfig() throws ScriptException {
		try {
			JSObject config = invokeFunction("getConfig");
			String[] bitCodeNames = ((String) config.getMember("loadToGlobal")).split(",");
			
			for(String bitCodeName : bitCodeNames) {
				bitCodeName = bitCodeName.trim();
				String bitCodeFileName = bitCodeName.startsWith("lib/") ? bitCodeName : "lib/" + bitCodeName;
				bitCodeFileName = bitCodeFileName.endsWith(".js") ? bitCodeFileName : bitCodeFileName + ".js";
				
				int firstIndexToSearch = bitCodeName.lastIndexOf('/') > -1 ? bitCodeName.lastIndexOf('/') : 0;
				bitCodeName = bitCodeName.replaceAll(".js", "").substring(firstIndexToSearch, bitCodeName.length());
				
				engine.eval("var " + bitCodeName + " = require('" + bitCodeFileName + "')", rootContext);
			}
		} catch(NoSuchMethodException e) {
			e.printStackTrace();
		}
	}
	
	@SuppressWarnings("restriction")
	public JSObject eval(String expression) throws ScriptException {
		Bindings reqScope = new SimpleBindings();
		reqScope.putAll(engine.getContext().getBindings(ScriptContext.ENGINE_SCOPE));
		
		ScriptContext reqContext = new SimpleScriptContext();
		reqContext.setBindings(reqScope, ScriptContext.ENGINE_SCOPE);
		
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
		int i;
		for(i = 1; i < (fullPath.length - 1); i++) {
			scriptObjectMirror = (ScriptObjectMirror) scriptObjectMirror.get(fullPath[i]);
		}
		
		JSObject result = null;
		try {
			result = (JSObject) scriptObjectMirror.callMember(fullPath[i], params);
		} catch(ClassCastException ignored) { }
		
		return result;
	}
	
	@SuppressWarnings("restriction")
	public static ScriptObjectMirror require(String fileName, boolean loadToGlobal) {
		ScriptObjectMirror scriptObject = null;
		
		try {
			String fileNameNormalized = fileName.endsWith(".js") ? fileName : fileName.concat(".js");
			File scriptFile = new File(fileNameNormalized);
			
			String scriptContent = new String(Files.readAllBytes(scriptFile.toPath()), StandardCharsets.UTF_8);
			
			if(loadToGlobal) {
				scriptObject = (ScriptObjectMirror) engine.eval(scriptContent, rootContext);
			} else {
				Bindings reqScope = new SimpleBindings();
				reqScope.putAll(engine.getContext().getBindings(ScriptContext.ENGINE_SCOPE));
				
				ScriptContext reqContext = new SimpleScriptContext();
				reqContext.setBindings(reqScope, ScriptContext.ENGINE_SCOPE);
				
				setupContext(reqContext);
				
				scriptObject = (ScriptObjectMirror) engine.eval(scriptContent, reqContext);
			}
		} catch(IOException e) {
			System.out.println("[ERROR] Cannot load " + fileName + " module.");
			e.printStackTrace();
		} catch(ScriptException se) {
			System.out.println("[ERROR] Error running module code: " + fileName + ".");
			se.printStackTrace();
		}
		
		return scriptObject;
	}

	private static void setupContext(ScriptContext context) throws ScriptException {
		ThrustUtils.loadPolyfills(engine, context);
	}
}
