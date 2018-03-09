// Starting directory should match root directory in config file
process.chdir(__dirname)

// Load configuration globally
require('./lib/config')

// Define struct to monitor app
let instance = {
  'db': null,
  'app': null,
  'server': null
}

// Load database
const database = require('./lib/database')
database.connect.then((value) => {
  global.logger.log('info', 'Connected to database: URL is %s', value)
}).catch((err) => {
  global.logger('error', err)
})

// Start app
instance.db = database.get()
instance.app = require('./lib/app').app
instance.server = require('./lib/server').goLive()

// Report on status
if (!instance.db) global.logger.log('error', 'Where is the database???')
else if (!instance.app) global.logger.log('error', 'Where is the Express app???')
else if (!instance.server)global.logger.log('error', 'Where is the HTTP server???')
else global.logger.log('info', '===== DB / App / Server stack is now active. =====')
