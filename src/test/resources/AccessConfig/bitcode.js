getConfig = function() {
	return {}
}

let config = getConfig()

console.log(JSON.stringify(config))
config.name = 'bitcode.js'
console.log(JSON.stringify(config))