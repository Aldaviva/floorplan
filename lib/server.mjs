import config from '../config.mjs';
import defaults from 'lodash-es';
import cors from 'cors';
import database from './database.mjs';
import express from 'express';
import http from 'http';
import path from 'path';
import slash from 'express-slash';

defaults(config, {
	wwwPort: 3000,
	dbHost: "127.0.0.1",
	dbPort: 27017,
	dbName: "floorplan",
	mountPoint: "/"
});

config.mountPoint = config.mountPoint.replace(/\/+$/, "");

database.connect().done();

const server = express();
export default server;
const publicDir = path.join(__dirname, '../public');

server.set('env', 'production');
server.set('port', config.wwwPort);
server.set('views', `${__dirname}/../views`);
server.set('view engine', 'hbs');
server.enable('strict routing');
server.use(express.compress());
server.use(config.mountPoint, express.favicon('public/favicon.ico'));
server.use(express.logger());
server.use(express.bodyParser());
server.use(cors());
server.use(config.mountPoint, server.router);
server.use(config.mountPoint, slash());
server.use((err, req, res, next) => {
	console.error(err.stack || err.message);
	res.type('text');
	res.send(500, err.message);
});
server.use(config.mountPoint, require('less-middleware')({ src: publicDir }));
server.use(config.mountPoint, express.static(publicDir, { maxAge: 4*60*60*1000 }));
server.use(config.mountPoint, (req, res, next) => {
	if(/^\/photos\/[0-9a-f]+\.jpg$/.test(req.path)){
		res.redirect('/images/missing_photo.jpg');
	} else {
		console.log(404, req.path);
		next();
	}
});

http.createServer(server).listen(server.get('port'), () => {
	console.log('Listening on http://*:%d%s', server.get('port'), config.mountPoint);
});

import '../routes/index.mjs';
