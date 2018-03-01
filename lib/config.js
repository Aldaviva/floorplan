// ===== Reference: https://github.com/lorenwest/node-config/ =====

// Chain: index <- server <- database <- config

// Load from config/default.json
var path = require('path')
var config = module.exports = require('config')
global.companyName = config.get('companyName') || 'The Company'
global.dbHost = config.get('dbHost') || 'localhost'
global.dbPort = config.get('dbPort') || '27017'
global.dbName = config.get('dbName') || 'floorplan'
global.dirData = path.normalize(config.get('dirData')) || '/opt/floorplan/data'
global.dirPublic = path.normalize(config.get('dirPublic')) || '/opt/floorplan/public'
global.dirRoot = path.normalize(config.get('dirRoot')) || '/opt/floorplan'
global.logfile = path.normalize(config.get('logFile')) || '/var/log/floorplan.log'
global.mountPoint = config.get('mountPoint') || '/'
global.wwwPort = config.get('wwwPort') || '3001'

// Create additional variables
global.dirMaps = path.join(global.dirRoot, 'views/maps')
global.dirPhotos = path.join(global.dirData, 'photos')

// Storm integration
global.stormUsername = ''
global.stormPassword = ''

// ===== Reference: https://github.com/winstonjs/winston/tree/2.4.0 =====

// Create logger
global.logger = require('winston')
global.logger.configure({
  transports: [
    new (global.logger.transports.File)({ filename: global.logfile })
  ]
})

// Indicate logging is working, and config is sound.
global.logger.log('info', '===== Config loaded ======')
global.logger.log('info', 'Root dir is %s', global.dirRoot)
global.logger.log('info', 'Maps will be loaded from %s', global.dirMaps)
global.logger.log('info', 'Photos will be loaded from %s', global.dirPhotos)
global.logger.log('info', '===========')
