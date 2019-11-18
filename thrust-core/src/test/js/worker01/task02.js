const jsscheduler = require('test/thrustjs/jsscheduler')

const task = () => {
    console.log('*-*-*-*-*-*-*-* TASK 2 CALLED -*-*-*-*-*-*-*')
    jsscheduler.sleep(123)
    console.log('*-*-*-*-*-*-*-* TASK 2 FINISHED -*-*-*-*-*-*-*')
}

exports = task
