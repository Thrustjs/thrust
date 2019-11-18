console.log('(JS) Teste worker02')

const scheduler = require('test/thrustjs')

if (!scheduler) {
    throw new Error('(JS) No scheduler')
}
scheduler.schedule(3000, 'task01.js')
scheduler.schedule(1500, 'task02.js')

const Thread = Java.type('java.lang.Thread')
Thread.sleep(4000)
