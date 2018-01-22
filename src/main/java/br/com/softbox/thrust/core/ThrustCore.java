package br.com.softbox.thrust.core;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.util.Arrays;
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

@SuppressWarnings("restriction")
public class ThrustCore {
	private ScriptEngine engine;
	private ScriptContext rootContext;
	private Bindings rootScope;

	private String rootPath;
	
	public ThrustCore() throws ScriptException, IOException, NoSuchMethodException {
		initialize(null);
	}

	public ThrustCore(String mainFilePath) throws IOException, NoSuchMethodException, ScriptException {
		File mainFile = new File(mainFilePath);

		rootPath = mainFile.getParent();

		initialize(rootPath);

		loadScript(mainFilePath);
	}

	public static void runCLI(String[] args) throws ScriptException, NoSuchMethodException {
		ScriptEngine engine = new ScriptEngineManager().getEngineByName("nashorn");
		ScriptContext rootContext = engine.getContext();
		Bindings rootScope = rootContext.getBindings(ScriptContext.ENGINE_SCOPE);

		setupContext(engine, rootContext);

		ThrustUtils.loadCLI(engine, rootContext);

		ThrustCore.invokeFunction(engine, rootScope, "runCLI",
				Arrays.asList(args).stream().collect(Collectors.joining(",")));
	}

	protected void initialize(String rootPath) throws ScriptException, IOException, NoSuchMethodException {
		System.setProperty("nashorn.args", "--language=es6");
		System.setProperty("java.security.egd", "file:/dev/urandom");

		if (rootPath == null) {
			rootPath = new File("").getAbsolutePath();
		} else {
			validateRootPath();
		}

		this.rootPath = rootPath;

		engine = new ScriptEngineManager().getEngineByName("nashorn");
		rootContext = engine.getContext();
		rootScope = rootContext.getBindings(ScriptContext.ENGINE_SCOPE);

		setupContext(engine, rootContext);

		rootScope.put("rootPath", rootPath);

		ThrustUtils.loadPlatform(engine, rootContext);
	}

	public JSObject loadScript(String fileName) throws ScriptException, NoSuchMethodException, IOException {

		InputStream in = new FileInputStream(new File(fileName));

		String scriptContent = null;

		try (BufferedReader reader = new BufferedReader(new InputStreamReader(in))) {
			scriptContent = reader.lines().collect(Collectors.joining("\n"));
		}

		ScriptContext reqContext = new SimpleScriptContext();
		Bindings reqScope = new SimpleBindings();

		reqScope.putAll(rootScope);
		reqContext.setBindings(reqScope, ScriptContext.ENGINE_SCOPE);
		reqScope.put("reqContext", reqContext);

		setupContext(engine, reqContext);

		JSObject result = null;

		try {
			result = (JSObject) engine.eval(scriptContent, reqContext);
		} catch (ClassCastException ignored) {
		}

		return result;
	}

	public JSObject eval(String expression) throws ScriptException {
		ScriptContext reqContext = new SimpleScriptContext();
		Bindings reqScope = new SimpleBindings();

		reqScope.putAll(rootScope);
		reqContext.setBindings(reqScope, ScriptContext.ENGINE_SCOPE);
		reqScope.put("reqContext", reqContext);

		setupContext(engine, reqContext);

		JSObject result = null;
		try {
			result = (JSObject) engine.eval(expression, reqContext);
		} catch (ClassCastException ignored) {
		}

		return result;
	}

	public JSObject invokeFunction(String function, Object... params) throws NoSuchMethodException, ScriptException {
		return invokeFunction(engine, rootScope, function, params);
	}

	public static JSObject invokeFunction(ScriptEngine engine, Bindings scope, String function, Object... params)
			throws NoSuchMethodException, ScriptException {
		Invocable inv = (Invocable) engine;
		String[] fullPath = function.split("\\.");

		if (fullPath.length == 1) {
			return (JSObject) inv.invokeFunction(function, params);
		}

		ScriptObjectMirror scriptObjectMirror = (ScriptObjectMirror) scope.get(fullPath[0]);
		int i = 1;
		for (; i < (fullPath.length - 1); i++) {
			scriptObjectMirror = (ScriptObjectMirror) scriptObjectMirror.get(fullPath[i]);
		}

		JSObject result = null;
		try {
			result = (JSObject) scriptObjectMirror.callMember(fullPath[i], params);
		} catch (ClassCastException ignored) {
		}

		return result;
	}

	public JSObject require(String fileName) throws Exception {
		return invokeFunction("require", fileName);
	}

	private void validateRootPath() {
		File file = new File(rootPath);
		if (!file.exists()) {
			throw new IllegalStateException("[ERROR] Invalid rootPath: \"" + rootPath + "\".");
		}
	}

	public static void setupContext(ScriptEngine engine, ScriptContext context) throws ScriptException {
		ThrustUtils.loadPolyfills(engine, context);
	}
}
