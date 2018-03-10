// Starting directory should match root directory in config file
process.chdir(__dirname)

// Load configuration globally
require('./lib/config')

// Load database
const database = require('./lib/database')
database.connect.then((value) => {
  global.logger.log('info', 'Connected to database: URL is %s', value)
}).catch((err) => {
  global.logger('error', err)
})

// Start app
require('./lib/app')
global.logger.log('info', '===== DB / App stack is now active. =====')
