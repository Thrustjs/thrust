this.name = "index.js"

print(this.name)

require("src/test/resources/ContextIsolation/bitcode")

print(this.name)