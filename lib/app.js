// === index.js calls this file ===

/*
 * References
 * https://expressjs.com/en/guide/migrating-4.html
 * https://github.com/senchalabs/connect
 * https://www.terlici.com/2014/09/29/express-router.html
*/

var bodyParser = require('body-parser')
var path = require('path')

// ExpressJS app
const express = require('express')
const app = express()
app.use(require('express-winston').logger({ winstonInstance: global.logger })) // tie to logger
// app.use(require('compression'))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json)
app.use(bodyParser.text)
// app.use(require('cors'))
app.use(require('connect-favicons')(path.join(global.dirPublic, 'icons')))
app.set('env', 'production')
app.set('views', path.join(global.dirRoot, 'views'))
app.set('view engine', 'hbs')
app.use(require('connect-less')({ src: path.join(global.dirPublic, 'styles') }))
app.use(express.static(global.dirPublic, { maxAge: 4 * 60 * 60 * 1000 }))

// Load routes
app.use(require('./routes'))

// catch 404 error
app.use(function (req, res, next) {
  var err = new Error('Not Found')
  err.status = 404
  global.logger.log('404 error:', err)
  next(err)
})

// catch 500 error
app.use(function (err, req, res, next) {
  global.logger.log('error', err.stack || err.message)
  res.type('text')
  res.send(500, err.message)
  global.logger.log('500 error:', err)
  next()
})

// Go-Live
app.use(require('connect-slashes')(true, { base: global.mountPoint })) // prepends a base url to the redirect
app.listen(global.wwwPort, function () {
  var goneLive = 'Express server listening on port ' + global.wwwPort + ' expecting callback to ' + global.mountPoint
  global.logger.log('info', goneLive)
  console.log(goneLive)
})
