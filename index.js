// Starting directory should match root directory in config file
process.chdir(__dirname)

// Seed global configuration
require('./lib/config')

// Start database
const database = require('./lib/database')
database.connect()

// Start app
require('./lib/app')

// Cleanup
database.close()
