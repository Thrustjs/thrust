var File = Java.type("java.io.File");
var ThrustUtils = Java.type("br.com.softbox.thrust.util.ThrustUtils");
var BufferedReader = Java.type("java.io.BufferedReader");
var InputStreamReader = Java.type("java.io.InputStreamReader");
var Collectors = Java.type("java.util.stream.Collectors");

var CLI_COMMANDS = [ {
	name : [ 'init' ],
	args : [ {
		name : 'path',
		required : false,
		description : 'Path to create the seed'
	} ],
	options : [ {
		name : [ 'template', 't' ],
		description : 'Template to be used on init',
		def : 'web-complete'
	} ],
	runner : '/cli/cliInit'
}, {
	name : [ 'install' ],
	args : [ {
		name : 'bitcode',
		description : 'Name of the bitcode to be installed.'
	} ],
	runner : '/cli/cliInstall'
} ];

function require(fileName) {
	return (function() {
		var exports = {};
		var attrs = {};
		
		if (!fileName.endsWith(".js")) {
			fileName = fileName.concat(".js");
		}
		
		var scriptContent = ThrustUtils.loadResource(fileName); 
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

function log(str) {
	java.lang.System.out.print(str);
}

function runCLI(args) {
	if (typeof args == "string") {
		args = args.split(',');
	}
	
	require('/cli/cliProcessor').process(args, CLI_COMMANDS);
}