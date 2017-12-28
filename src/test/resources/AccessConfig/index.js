let config = getConfig()

print(JSON.stringify(config))
config.name = 'index.js'
print(JSON.stringify(config))
var bitCode = require("src/test/resources/AccessConfig/bitcode.js")
config = getConfig()
print(JSON.stringify(config))