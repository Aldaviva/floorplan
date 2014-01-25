var server           = require('../lib/server');
var express          = require('express');

var photoStaticHandler = express.static('./data', { maxAge: 4*60*60*1000 });

server.get('/endpoints/:id/photo', function(req, res, next){
	req.url = '/photos/'+req.params.id+'.jpg';
	photoStaticHandler(req, res, next);
});