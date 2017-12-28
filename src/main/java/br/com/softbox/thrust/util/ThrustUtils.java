package br.com.softbox.thrust.util;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;

import javax.script.ScriptContext;
import javax.script.ScriptEngine;
import javax.script.ScriptException;

//novo: CRIAR O ESQUEMA DE CACHE NO REQUIRE COM BABEL

public class ThrustUtils {
	private static String polyfills = "if (!Object.assign) {     Object.defineProperty(Object, 'assign', {         enumerable: false,         configurable: true,         writable: true,         value: function (target) {             'use strict';             if (target === undefined || target === null) {                 throw new TypeError('Cannot convert first argument to object');             }              var to = Object(target);             for (var i = 1; i < arguments.length; i++) {                 var nextSource = arguments[i];                 if (nextSource === undefined || nextSource === null) {                     continue;                 }                 nextSource = Object(nextSource);                  var keysArray = Object.keys(Object(nextSource));                 for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {                     var nextKey = keysArray[nextIndex];                     var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);                     if (desc !== undefined && desc.enumerable) {                         to[nextKey] = nextSource[nextKey];                     }                 }             }             return to;         }     }); }   if (!Object.values) {     Object.values = function values(target) {         return Object.getOwnPropertyNames(target).map(function (k) {             return target[k]         })     } }   if (!Array.prototype.find) {     Object.defineProperty(Array.prototype, 'find', {         value: function (predicate) {             if (this == null) {                 throw new TypeError('\"this\" is null or not defined');             }              var o = Object(this);             var len = o.length >>> 0;              if (typeof predicate !== 'function') {                 throw new TypeError('predicate must be a function');             }              var thisArg = arguments[1];             var k = 0;              while (k < len) {                 var kValue = o[k];                 if (predicate.call(thisArg, kValue, k, o)) {                     return kValue;                 }                 k++;             }              return undefined;         }     }); } ";
	private static String requireWrapper = "function require(fileName) { const ThrustCore = Java.type(\"br.com.softbox.thrust.core.ThrustCore\"); const map = ThrustCore.require(fileName, false); const attrs = {}; for (var key in map) { attrs[key] = map[key]; } return attrs; }";
	private static String configStr = null;
	
	public static void loadPolyfills(ScriptEngine engine, ScriptContext context) throws ScriptException {
		loadOnContext(engine, context, polyfills);
	}

	public static void loadRequireWrapper(ScriptEngine engine, ScriptContext context) throws ScriptException {
		loadOnContext(engine, context, requireWrapper);
	}

	public static void loadConfig(String rootPath, ScriptEngine engine, ScriptContext context) throws ScriptException, IOException {
		if(configStr == null) {
			File configJson = new File(rootPath + File.separator + "config.json");
			if(!configJson.exists()) {
				loadOnContext(engine, context, "function getConfig(){return {}}");
				return;
			}
			configStr = new String(Files.readAllBytes(configJson.toPath()), StandardCharsets.UTF_8);
		}
		loadOnContext(engine, context, "function getConfig(){return " + configStr + "}");
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
