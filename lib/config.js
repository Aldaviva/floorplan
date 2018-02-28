// ===== Reference: https://github.com/lorenwest/node-config/ =====

// Load from config/default.json
var config = module.exports = require('config')
global.companyName = config.get('companyName') || 'The Company'
global.dbHost = config.get('dbHost') || 'localhost'
global.dbPort = config.get('dbPort') || '27017'
global.dbName = config.get('dbName') || 'floorplan'
global.dirData = config.get('dirData') || '/opt/floorplan/data'
global.dirPublic = config.get('dirPublic') || '/opt/floorplan/public'
global.dirRoot = config.get('dirRoot') || '/opt/floorplan'
global.logfile = config.get('logFile') || '/var/log/floorplan.log'
global.mountPoint = config.get('mountPoint') || '/'
global.wwwPort = config.get('wwwPort') || '3001'

// Create additional variables
var path = require('path')
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
