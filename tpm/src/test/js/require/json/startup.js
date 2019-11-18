const json = require('./file')

print(json.constructor.name === 'Object' && json.value === 'Test')