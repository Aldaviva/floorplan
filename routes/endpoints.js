var _             = require('lodash');
var cache_manager = require('cache-manager');
var config        = require('../config');
var express       = require('express');
var request       = require('request');
var server        = require('../lib/server');

var photoStaticHandler = express.static('./data', { maxAge: 4*60*60*1000 });
var memory_cache = cache_manager.caching({
	store: 'memory',
	max: 100,
	ttl: 5 //seconds
});

var stormRequestOptions = {
	auth: {
		'username': config.stormUsername,
		'password': config.stormPassword,
		'sendImmediately': true
	},
	json: true,
	// proxy: 'http://10.4.5.181:9998',
	// strictSSL: false,
	timeout: 3000
};

server.get('/endpoints', function(req, res, next){
	var url = config.stormApiRoot+'endpoints';
	// console.log("request to storm ("+url+")...");
	if(isStormIntegrationEnabled){
		request(url, stormRequestOptions, function(err, stormResponse, body){
			// console.log("response from storm", stormResponse);
			if(err != null){
				console.warn("failed to get endpoints from Storm", err);
				res.json(500, err);
			} else {
				res.json(body);
			}
		});
	} else {
		res.json([]);
	}
});

server.get('/endpoints/status', function(req, res, next){
	if(isStormIntegrationEnabled()){
		memory_cache.wrap('bjn-endpoints', function(cacheResult){
			console.log("Requesting endpoint status from Storm...");
			request(config.stormApiRoot+'endpoints/status', stormRequestOptions, function(err, res, body){
				cacheResult(err, body);
			});
		}, function(err, result){
			if(err != null){
				console.warn("failed to get endpoint status from Storm", err);
				res.json(500, err);
			} else {
				res.json(result);
			}
		});
	} else {
		res.json([]);
	}
});

server.get('/endpoints/:id/photo', function(req, res, next){
	req.url = '/photos/'+req.params.id+'.jpg';
	photoStaticHandler(req, res, next);
});

function isStormIntegrationEnabled(){
	return config.stormUsername && config.stormUsername.length && config.stormPassword && config.stormPassword.length;
}