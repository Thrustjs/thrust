const jsscheduler = require('test/thrustjs/jsscheduler')

const resource = {
	count: 1
}

const task = () => {
    console.log(`(JS) TASK-03=>count(${resource.count})`)
    resource.count++
    jsscheduler.sleep(101)
    console.log(`(JS) TASK-03=>count(${resource.count})`)
}

exports = task
