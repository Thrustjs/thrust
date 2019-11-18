const config = require('./config')
const getConfig = config.getConfig

const databaseUrl = getConfig().database.sqlite.urlConnection
console.log(`The database: ${databaseUrl}.`)
