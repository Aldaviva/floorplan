// ===== lib/server.js & lib/routes.js will call upon this =====

// Main references: https://expressjs.com/en/guide/migrating-4.html & https://github.com/senchalabs/connect

var express = require('express')
var path = require('path')
var config = require('./config')
var localMountPoint = config.mountPoint.replace(/\/+$/, '') // old solution appeared to clobber the rev-prox substring

// ExpressJS app
var app = express()
app.use(localMountPoint, express.Router(['strict'])) // define strict routing
app.use(require('connect-slashes'))
app.use(require('express-winston').logger({ winstonInstance: global.logger })) // tie to logger
app.use(require('compression'))
app.use(express.urlencoded({ extended: true }))
app.use(express.json)
app.use(require('cors'))
app.use(require('connect-favicons')(path.join(global.dirPublic, 'icons')))
app.set('env', 'production')
app.set('views', path.join(global.dirRoot, 'views'))
app.set('view engine', 'hbs')
app.use(function (err, req, res, next) {
  global.logger.log('error', err.stack || err.message)
  res.type('text')
  res.send(500, err.message)
  next()
})
app.use(require('connect-less')({ src: path.join(global.dirPublic, 'styles') }))
app.use(express.static(global.dirPublic, { maxAge: 4 * 60 * 60 * 1000 }))

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found')
  err.status = 404
  next(err)
})

// Make this accessible to other parts of the system
module.exports = app
