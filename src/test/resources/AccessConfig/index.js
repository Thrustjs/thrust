let config = getConfig()

print(JSON.stringify(config))
config.name = 'index.js'
print(JSON.stringify(config))
var bitCode = require("./bitcode.js")
config = getConfig()
print(JSON.stringify(config))