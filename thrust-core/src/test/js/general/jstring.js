const StringHelper = Java.type('br.com.softbox.thrust.api.ThrustStringHelper')

const str = null
let array = StringHelper.getBytes(null, 'utf-8')
if (!array) {
	console.log('no array')
}
array = StringHelper.getBytes('123', 'utf-8')
if (array) {
	console.log(`array length = ${array.length}`)
}