// Main references: https://expressjs.com/en/guide/migrating-4.html & https://github.com/senchalabs/connect

// Chain: index <- server <- database <- config
require('./database')

// Modules used as variables
var express = require('express')
var expressWinston = require('express-winston')
var http = require('http')
var path = require('path')
// var proxy = require('http-proxy-middleware')

// TODO: Is https://github.com/chimurai/http-proxy-middleware necessary for fixing reverse-proxy?
// var localMountPoint = global.mountPoint.replace(/\/+$/, '') // old solution appeared to clobber the rev-prox substring
var localMountPoint = '/'

// ExpressJS app
global.app = express()
global.app.use(localMountPoint, express.Router(['strict'])) // define strict routing
global.app.use(require('connect-slashes'))
global.app.use(expressWinston.logger({ winstonInstance: global.logger })) // tie to logger
global.app.use(require('compression'))
global.app.use(express.urlencoded({ extended: true }))
global.app.use(express.json)
global.app.use(require('cors'))
global.app.use(require('connect-favicons')(path.join(global.dirPublic, 'icons')))
global.app.set('env', 'production')
global.app.set('views', path.join(global.dirRoot, 'views'))
global.app.set('view engine', 'hbs')
global.app.use(function (err, req, res, next) {
  global.logger.log('error', err.stack || err.message)
  res.type('text')
  res.send(500, err.message)
  next()
})
global.app.use(require('connect-less')({ src: path.join(global.dirPublic, 'styles') }))
global.app.use(express.static(global.dirPublic, { maxAge: 4 * 60 * 60 * 1000 }))
global.app.use(localMountPoint, function (req, res, next) {
  if (/^\/photos\/[0-9a-f]+\.jpg$/.test(req.path)) {
    res.redirect('/images/missing_photo.jpg')
  } else {
    global.logger.log('error', '404 in server.js: %s', req.path)
    next()
  }
})

// Load other routes
require('../routes')

// Create server
http.createServer(global.app).listen(global.wwwPort, function () {
  var goneLive = 'Express server listening on port ' + global.wwwPort + ' expecting callback to ' + global.mountPoint
  global.logger.log('info', goneLive)
  console.log(goneLive)
})
