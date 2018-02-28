// Main references: https://expressjs.com/en/guide/migrating-4.html & https://github.com/senchalabs/connect

var database = require('./database')
var _ = require('lodash')
var compression = require('compression')
var config = require('node-config')
var cors = require('cors')
var express = require('express')
var favicons = require('connect-favicons')
var http = require('http')
var morgan = require('morgan')
var path = require('path')
var slash = require('connect-slashes')

_.defaults(config, {
  wwwPort: 3001,
  dbHost: 'localhost',
  dbPort: 27017,
  dbName: 'floorplan',
  mountPoint: '/'
})

// config.mountPoint = config.mountPoint.replace(/\/+$/, '')
database.connect().done()
global.publicDir = path.join(__dirname, '../public')
global.mapsDir = path.join(__dirname, '../views/maps')
global.router = express.Router(['strict'])
var app = module.exports = express()

app.set('env', 'production')
app.set('port', config.wwwPort)
app.set('views', path.join(__dirname, '/../views'))
app.set('view engine', 'hbs')
app.use(compression())
app.use(favicons(path.join(global.publicDir, 'icons')))
app.use(morgan('combined'))
app.use(express.urlencoded({
  extended: true
}))
app.use(express.json)
app.use(cors())
app.use(slash(true, { base: config.mountPoint })) // prepends a base url to the redirect
app.use(function (err, req, res, next) {
  console.error(err.stack || err.message)
  res.type('text')
  res.send(500, err.message)
})
app.use(require('connect-less')({ src: global.publicDir }))
app.use(express.static(global.publicDir, { maxAge: 4 * 60 * 60 * 1000 }))
global.router.use(config.mountPoint, function (req, res, next) {
  if (/^\/photos\/[0-9a-f]+\.jpg$/.test(req.path)) {
    res.redirect('/images/missing_photo.jpg')
  } else {
    console.log(404, req.path)
    next()
  }
})

// Routing
require('../routes/')
global.router.all('*')

// Create server
http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port') + ' expecting callback to ' + config.mountPoint)
})
