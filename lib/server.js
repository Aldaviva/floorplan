var _        = require('lodash');
var config   = require('../config');
var database = require('./database');
var express  = require('express');
var http     = require('http');
var path     = require('path');
var slash    = require('express-slash');

_.defaults(config, {
	wwwPort: 3000,
	dbHost: "127.0.0.1",
	dbPort: 27017,
	dbName: "floorplan",
	mountPoint: "/"
});

database.connect().done();
var server = module.exports = express();
var publicDir = path.join(__dirname, '../public');

server.set('env', 'production');
server.set('port', config.wwwPort);
server.set('views', __dirname + '/../views');
server.set('view engine', 'hbs');
server.enable('strict routing');
server.use(express.compress());
server.use(config.mountPoint, express.favicon('public/favicon.ico'));
server.use(express.logger());
server.use(express.bodyParser());
server.use(config.mountPoint, server.router);
server.use(config.mountPoint, slash());
server.use(function(err, req, res, next){
	console.error(err.stack || err.message);
	res.type('text');
	res.send(500, err.message);
});
server.use(config.mountPoint, require('less-middleware')({ src: publicDir }));
server.use(config.mountPoint, express.static(publicDir, { maxAge: 6*60*60*1000 }));
server.use(config.mountPoint, function(req, res, next){
	if(/^\/images\/photos\//.test(req.path)){
		res.redirect('/images/missing_photo.jpg');
	} else {
		next();
	}
});

http.createServer(server).listen(server.get('port'), function(){
	console.log('Listening on http://*:%d%s', server.get('port'), config.mountPoint);
});

require('../routes/');