const SimpleThrustWorkerManager = Java.type('br.com.softbox.thrust.api.thread.simple.SimpleThrustWorkerManager')
const ThrustContextAPI = Java.type('br.com.softbox.thrust.api.ThrustContextAPI')

const initManager = () => {
    manager.initPool(1, 2, __ROOT_DIR__)
}

console.log('simple: main.')
const manager = new SimpleThrustWorkerManager()
let hasErr = false
initManager()
try {
    initManager()
    hasErr = true
} catch (e) {
    console.log('simple: confirmed failed: ', e)
}
if (hasErr) {
    throw new Error('Cannot continue')
}
console.log('simple: running script')
manager.runScript(`script01.js`)
console.log('simple: waiting scripts')
manager.waitActiveWorkers(1045)
console.log('simple: continue.', manager.getWorkers().size())
const v = ThrustContextAPI.getValue('simple-value')
console.log('simple: vale:', v)
manager.shutdown(true)
