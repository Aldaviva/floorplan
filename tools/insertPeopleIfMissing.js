var fs = require('fs');
var mongo = require('mongodb');

var sfoc = require('./sfoc');

process.chdir(__dirname);

mongo.MongoClient.connect('mongodb://localhost:27017/floorplan', function(err, db){
	if(err) throw err;

	db.collection('people', function(err, people){
		sfoc.forEach(function(person){
			people.findOne({ fullname: person.fullname }, function(err, doc){
				if(!doc){
					people.insert(person, function(err){
						if(err){
							console.error("error inserting person", person);
						} else {
							console.log("inserted "+person.fullname);
						}
					});
				} else {
					console.log("skipping "+person.fullname);
				}
			});
		});
	});
});
