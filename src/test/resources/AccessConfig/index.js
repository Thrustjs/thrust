let config = getConfig()

console.log(JSON.stringify(config))
config.name = 'index.js'
console.log(JSON.stringify(config))
var bitCode = require("./bitcode.js")
config = getConfig()
console.log(JSON.stringify(config))