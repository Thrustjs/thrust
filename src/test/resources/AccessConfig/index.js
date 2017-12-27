let config = getConfig()

print(JSON.stringify(config))
config.name = 'index.js'
print(JSON.stringify(config))
var bitCode = require("/Users/cleverson/Documents/Softbox/Projetos/ThrustJS/workspace/thrust/src/test/resources/AccessConfig/bitcode.js")
config = getConfig()
print(JSON.stringify(config))