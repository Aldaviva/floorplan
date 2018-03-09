// === index.js calls this file ===

// Object for HTTP/app server
let httpServer

// Activate httpServer
exports.goLive = function (app) {
  httpServer = require('http').createServer(app).listen(global.wwwPort, 'localhost')
  const goneLive = 'Express server listening on port ' + global.wwwPort + ' expecting callback to ' + global.mountPoint
  global.logger.log('info', goneLive)
  console.log(goneLive)
  return httpServer
}

// Access httpServer
exports.get = function () {
  if (httpServer) return httpServer
  else return null
}
