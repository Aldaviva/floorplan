// === index.js calls this file ===

const bodyParser = require('body-parser')
const express = require('express')
const exphbs = require('express-hbs')
const path = require('path')

// Create ExpressJS app
const app = express()
app.use(require('express-winston').logger({ winstonInstance: global.logger })) // tie to logger
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json)
app.use(bodyParser.text)
// app.use(require('cors'))
app.set('env', 'production')

// View engine
app.set('view engine', 'hbs')
app.engine('hbs', exphbs.express4({
  partialsDir: path.join(global.dirViews, 'partials'),
  layoutsDir: path.join(global.dirViews, 'layouts'),
  beautify: true
}))
app.set('views', global.dirViews)

// Handle errors
app.use((err, req, res, next) => {
  global.logger.log('error', ' %s error: ' + req, err.status)
  res.status(err.status).send('Application backend error')
  next()
})

// Additional middleware
app.use(require('connect-less')({ src: path.join(global.dirPublic, 'styles') }))
app.use(express.static(global.dirPublic, { maxAge: 4 * 60 * 60 * 1000 }))
app.use(require('connect-favicons')(path.join(global.dirPublic, 'icons')))
app.use(require('connect-slashes')(true, { base: global.mountPoint })) // prepends a base url to the redirect
// app.use(require('compression'))

// Go-Live
app.listen(global.wwwPort, (err) => {
  if (err) global.logger.log('error', 'App server error: %s', err)
  const goneLive = 'Express server listening on port ' + global.wwwPort + ' expecting callback to ' + global.mountPoint
  global.logger.log('info', goneLive)
  console.log(goneLive)
})

// Load routes
const routes = require('./routes')
app.use(routes.router)
