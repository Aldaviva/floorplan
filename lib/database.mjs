import config from '../config.mjs';
const logger   = console;
import mongo from 'mongodb';
const { ObjectID } = mongo;
import Q from 'q';

const dbOptions = {
	journal: true,
	numberOfRetries: Number.POSITIVE_INFINITY
};

const serverOptions = {
	auto_reconnect: true
};

const server = new mongo.Server(config.dbHost, config.dbPort, serverOptions);
server.allServerInstances().forEach(serverInstance => {
	serverInstance.dbInstances = serverInstance.dbInstances || [];
});

const db = new mongo.Db(config.dbName, server, dbOptions);

export default db;

let dbPromise;

export const OID = function(objectIdOrHexString){
	if(!objectIdOrHexString){
		return null;
	} else if(objectIdOrHexString instanceof ObjectID){
		return objectIdOrHexString;
	} else {
		return new ObjectID(objectIdOrHexString);
	}
};

export const connect = function(){
	return Q.ninvoke(db, "open")
		.then(onConnect)
		.fail(err => {
			logger.error(err.message);
		});
};

export const shutdown = function(){
	return dbPromise
		.then(() => {
			const deferred = Q.defer();
			db.close(deferred.makeNodeResolver());
			return deferred.promise;
		})
		.finally(() => {
			logger.log("Shut down.");
		});
};

function onConnect(db_){
	logger.info("Connected to mongodb://%s:%d/%s.", db_.serverConfig.host, db_.serverConfig.port, db_.databaseName);
	return db_;
}