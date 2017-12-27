getConfig = function() {
	return {}
}

let config = getConfig()

print(JSON.stringify(config))
config.name = 'bitcode.js'
print(JSON.stringify(config))