const Thread = Java.type('java.lang.Thread')
const call = () => console.log('Hello from thread')
try {
	const t = new Thread(call)
	t.start()
	t.join()
	console.log('Success')
} catch (e) {
	console.log('Error: ' + e.message)
}