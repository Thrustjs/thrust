const AScheduler = Java.type('br.com.softbox.thrust.test.work01.AScheduleSample2Threads')

console.log('(JS) Loading theScheduler *-*-*-*')

const schedule = (time, file) => {
	console.log("(JS) schedule from js *-*-*-* (I)", time, file)
	const theScheduler = new AScheduler(__ROOT_DIR__)
	theScheduler.schedule(time, file)
	console.log("(JS) scheduled *-*-*-* (II)")
}

exports = {
	schedule
}