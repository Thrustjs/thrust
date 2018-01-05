package br.com.softbox.thrust.util;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.stream.Collectors;

import javax.script.ScriptContext;
import javax.script.ScriptEngine;
import javax.script.ScriptException;

public class ThrustUtils {
	private static String polyfillsContent = null;
	private static String platformContent = null;
	
	static {
		platformContent = loadResource("/platform.js");
		polyfillsContent = loadResource("/polyfills.js");
	}

	private static String loadResource(String resourceName) {
		try {
			InputStream in = ThrustUtils.class.getResourceAsStream(resourceName); 
			BufferedReader reader = new BufferedReader(new InputStreamReader(in));
			return reader.lines().collect(Collectors.joining("\n"));
		} catch (Exception e) {
			e.printStackTrace();
			throw new IllegalStateException("[ERROR] failed to load resource file: " + resourceName, e);
		}
	}
	
	public static void loadPolyfills(ScriptEngine engine, ScriptContext context) throws ScriptException {
		loadOnContext(engine, context, polyfillsContent);
	}

	public static void loadPlatform(ScriptEngine engine, ScriptContext context) throws ScriptException {
		loadOnContext(engine, context, platformContent);
	}

	public static void loadOnContext(ScriptEngine engine, ScriptContext scriptContext, String scriptContent)
			throws ScriptException {
		if (engine == null || scriptContext == null) {
			throw new IllegalStateException("[ERROR] \"engine\" and \"scriptContext\" params must be not null.");
		}

		if (scriptContent == null || scriptContent.length() < 1) {
			throw new IllegalStateException("[ERROR] \"scriptContent\" param must be not null or empty.");
		}
		
		engine.eval(scriptContent, scriptContext);
	}
}
