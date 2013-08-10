var config  = require('../config');
var express = require('express');
var http    = require('http');
var path    = require('path');
var database = require('./database');

database.connect().done();
var server = module.exports = express();
var publicDir = path.join(__dirname, '../public');

server.set('env', 'production');
server.set('port', config.wwwPort || 3000);
server.set('views', __dirname + '/../views');
server.set('view engine', 'hbs');
server.use(express.compress());
server.use(express.favicon('public/favicon.ico'));
server.use(express.logger());
server.use(express.bodyParser());
server.use(express.methodOverride());
server.use(server.router);
server.use(function(err, req, res, next){
	console.error(err.stack || err.message);
	res.type('text');
	res.send(500, err.message);
});
server.use(require('less-middleware')({ src: publicDir }));
server.use(express.static(publicDir));

server.use(function(req, res, next){
	if(/^\/images\/photos\//.test(req.path)){
		res.redirect('images/missing_photo.jpg');
	} else {
		next();
	}
});

if ('development' == server.get('env')) {
	console.log("express development mode");
	server.use(express.errorHandler());
}

http.createServer(server).listen(server.get('port'), function(){
	console.log('Listening on *:%d.', server.get('port'));
});

var routes       = {};
routes.floorplan = require('../routes/floorplan');
routes.admin     = require('../routes/admin');
routes.people    = require('../routes/people');

server.get('/admin', routes.admin.index);

server.get   ('/people',           routes.people.list);
server.get   ('/people/:id',       routes.people.show);
server.post  ('/people',           routes.people.create);
server.put   ('/people/:id',       routes.people.update);
server.delete('/people/:id',       routes.people.delete);
server.post  ('/people/:id/photo', routes.people.setPhoto);
server.get   ('/uploadTest', routes.people.uploadTest);

server.get   ('/:office',          routes.floorplan.index);
server.get   ('/',                 routes.floorplan.index);
