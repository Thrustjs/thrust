
console.log('(JS) Teste worker01 <<<<<')

const scheduler = require('test/thrustjs')

if (!scheduler) {
    throw new Error('(JS) No scheduler')
}
scheduler.schedule(3000, 'task01.js')

console.log('(JS) After scheduled <<< AFTER CALLL :-/ Wait')
const Thread = Java.type('java.lang.Thread')
Thread.sleep(4000)
console.log('(JS) After scheduled <<< AFTER CALLL :-/ After wait')
