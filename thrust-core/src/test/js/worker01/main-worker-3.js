console.log('(JS) Teste worker02')

const scheduler = require('test/thrustjs')

if (!scheduler) {
    throw new Error('(JS) No scheduler')
}
scheduler.schedule(101, './subtask/task03.js')
scheduler.schedule(106, './subtask/task03.js')

const Thread = Java.type('java.lang.Thread')
Thread.sleep(4000)
