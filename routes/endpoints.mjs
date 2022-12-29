import config from '../config.mjs';
import cache_manager from 'cache-manager';
import express from 'express';
import request from 'request';
import server from '../lib/server.mjs';

const photoStaticHandler = express.static('./data', { maxAge: 4*60*60*1000 });
const memory_cache = cache_manager.caching({
	store: 'memory',
	max: 100,
	ttl: 5 //seconds
});

const stormRequestOptions = {
	auth: {
		username: config.stormUsername,
		password: config.stormPassword,
		sendImmediately: true
	},
	json: true,
	// proxy: 'http://10.4.5.181:9998',
	// strictSSL: false,
	timeout: 3000
};

server.get('/endpoints', (req, res, next) => {
	const url = `${config.stormApiRoot}endpoints`;
	// console.log("request to storm ("+url+")...");
	if(isStormIntegrationEnabled){
		request(url, stormRequestOptions, (err, stormResponse, body) => {
			// console.log("response from storm", stormResponse);
			if(err == null){
				res.json(body);
			} else {
				console.warn("failed to get endpoints from Storm", err);
				res.json(500, err);
			}
		});
	} else {
		res.json([]);
	}
});

server.get('/endpoints/status', (req, res, next) => {
	if(isStormIntegrationEnabled()){
		memory_cache.wrap('bjn-endpoints', cacheResult => {
			console.log("Requesting endpoint status from Storm...");
			request(`${config.stormApiRoot}endpoints/status`, stormRequestOptions, (err, res, body) => {
				cacheResult(err, body);
			});
		}, (err, result) => {
			if(err == null){
				res.json(result);
			} else {
				console.warn("failed to get endpoint status from Storm", err);
				res.json(500, err);
			}
		});
	} else {
		res.json([]);
	}
});

server.get('/endpoints/:id/photo', (req, res, next) => {
	req.url = `/photos/${req.params.id}.jpg`;
	photoStaticHandler(req, res, next);
});

function isStormIntegrationEnabled(){
	return config.stormUsername && config.stormUsername.length && config.stormPassword && config.stormPassword.length;
}