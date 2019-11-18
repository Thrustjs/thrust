const SimpleThrustWorkerManager = Java.type('br.com.softbox.thrust.api.thread.simple.SimpleThrustWorkerManager')

console.log('simple: main.')
const manager = new SimpleThrustWorkerManager()
manager.initPool(3, 3, __ROOT_DIR__)
console.log('simple: running script')
try {
    manager.runScript(`${__ROOT_DIR__}/no-script.js`)
    console.log('invalid require not informed a error')
} catch (e) {
    console.log('Failed to run no-script', e)
}
manager.waitActiveWorkers(1045)
console.log('simple: continue.', manager.getWorkers().size())
manager.shutdown(true)
console.log('bye bye')
