const filesystem = require('filesystem')
const Paths = Java.type('java.nio.file.Paths')

const config = {}

const getConfig = () => {
    if (!config.file) {
        const pathFile = Paths.get(__ROOT_DIR__, 'config.json').toString()
        config.file = filesystem.readJson(pathFile, 'utf-8')
    }
    return config.file
}

exports = {
    getConfig
}
