var names = require('./names');

var nameParts = [];

names.forEach(function(name){
	nameParts = nameParts.concat(name.split(/\s+/g));
});

var longestName = nameParts.reduce(function(prev, curr){
	return (prev.length > curr.length) ? prev : curr;
}, '');

console.log(longestName);