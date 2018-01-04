function require(fileName) {
	const ThrustCore = Java.type("br.com.softbox.thrust.core.ThrustCore");
	
	return (function(){
		var exports = {};
		var attrs = {};

		const moduleContent = ThrustCore.require(fileName);
		
		var map = eval(moduleContent);
		
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