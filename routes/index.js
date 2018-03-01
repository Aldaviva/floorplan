// Routing: lib/server.js <- this file <- require files (presuming here in "routes")

require('./admin')
require('./people')
require('./endpoints')
require('./floorplan')

global.logger.log('info', 'Route files loaded')
