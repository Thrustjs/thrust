print("bitcode.js")
require = function() {
	print("empty require function!")
}
this.require = function() {
	print("other empty require function!")
}
require("./anypath")