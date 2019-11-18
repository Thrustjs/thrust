const Thread = Java.type('java.lang.Thread')
const log = (x) => {
    console.log(x)
    return x + 1
}
const wait = (x) => {
    Thread.sleep(x * 10)
    return x
}
const promise = (x) => Promise.resolve(x)
    .then(log)
    .then(wait)
    .then(log)

console.log('First call')
promise(10)
console.log('Second call')
promise(30)
console.log('After all')
