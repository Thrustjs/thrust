package br.com.softbox.thrust.core;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;

import javax.script.Bindings;
import javax.script.ScriptContext;
import javax.script.ScriptEngine;
import javax.script.ScriptEngineManager;
import javax.script.ScriptException;
import javax.script.SimpleBindings;
import javax.script.SimpleScriptContext;

import jdk.nashorn.api.scripting.*;

import br.com.softbox.thrust.util.ThrustUtils;

public class ThrustCore {
	private static ScriptEngine engine;
	private static ScriptContext rootContext;
	
	static {
		System.setProperty("nashorn.args", "--language=es6");
		
		engine = new ScriptEngineManager().getEngineByName("nashorn");
		rootContext = engine.getContext();
	}
	
	public ThrustCore() throws ScriptException {
		ThrustUtils.loadConfig(engine, rootContext);
	}
	
	public void loadScript(String fileName) throws IOException, ScriptException {
        require(fileName);
    }
	
	@SuppressWarnings("restriction")
	public JSObject eval(String expression) throws ScriptException {
		Bindings reqScope = new SimpleBindings();
		reqScope.putAll(engine.getContext().getBindings(ScriptContext.ENGINE_SCOPE));
		
		ScriptContext reqContext = new SimpleScriptContext();
		reqContext.setBindings(reqScope, ScriptContext.ENGINE_SCOPE);
		
		return (JSObject) engine.eval(expression, reqContext);
	}
	
	@SuppressWarnings("restriction")
	public static ScriptObjectMirror require(String fileName) {
		ScriptObjectMirror scriptObject = null;
		
		try {
			String fileNameNormalized = fileName.endsWith(".js") ? fileName : fileName.concat(".js");
			File scriptFile = new File(fileNameNormalized);
			
			String scriptContent = new String(Files.readAllBytes(scriptFile.toPath()), StandardCharsets.UTF_8);
			
			Bindings reqScope = new SimpleBindings();
			reqScope.putAll(engine.getContext().getBindings(ScriptContext.ENGINE_SCOPE));
			
			ScriptContext reqContext = new SimpleScriptContext();
			reqContext.setBindings(reqScope, ScriptContext.ENGINE_SCOPE);
			
			setupContext(reqContext);
			
			scriptObject = (ScriptObjectMirror) engine.eval(scriptContent, reqContext);
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
		ThrustUtils.loadRequireWrapper(engine, context);
	}
}
