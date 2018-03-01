// Starting directory should match root directory in config file
process.chdir(__dirname)

// Chain: index <- server <- database <- config
require('./lib/server')
