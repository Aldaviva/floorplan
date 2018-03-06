// Starting directory should match root directory in config file
process.chdir(__dirname)

// Seed global configuration
require('./lib/config')

// Start app
require('./lib/app')
