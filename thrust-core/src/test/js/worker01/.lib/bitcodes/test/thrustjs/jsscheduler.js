const Thread = Java.type('java.lang.Thread')

const sleep = (time) => Thread.sleep(time)

const runTask = (time, file) => {
    time = time || 1
    console.log(`(JS) :-) :--O ::: jsscheduler.runTask(${time}, ${file}) -::: :-O`)
    const task = require(file)
    console.log(`(JS) :-) :--O ::: jsscheduler.runTask(${time}, ${file}) Is task? ${typeof task}`)
    sleep(time)
    console.log(`(JS) :-) :--O ::: jsscheduler.runTask(${time}, ${file}) After sleep`)
    task()
    console.log(`(JS) :-) :--O ::: jsscheduler.runTask(${time}, ${file}) Ended`)
}

exports = {
    runTask,
    sleep
}