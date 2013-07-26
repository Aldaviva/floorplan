var _ = require('lodash');
var fs = require('fs');
var people = require('../people');

console.log("People with no photo:");

_(people).pluck('fullname').sortBy().forEach(function(fullname){
	var photoExists = doesPhotoExist(fullname);
	if(!photoExists){
		console.log(fullname);
	}
});

function doesPhotoExist(fullname){
	return fs.existsSync(__dirname+'/../images/photos/'+fullname+'.jpg');
}