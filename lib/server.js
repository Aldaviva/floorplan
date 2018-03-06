// ===== Called from index.js =====

// Create server
require('http').createServer(require('./app').app).listen(global.wwwPort, function () {
  var goneLive = 'Express server listening on port ' + global.wwwPort + ' expecting callback to ' + global.mountPoint
  global.logger.log('info', goneLive)
  console.log(goneLive)
})

// Load other routes
require('./routes')
