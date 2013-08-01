var people = require('../people');
var _ = require('lodash');

var PHONE_PATTERN = /^\d{3}-\d{3}-\d{4}$/;

function isValidPhoneNumber(phoneNumber){
	return PHONE_PATTERN.test(phoneNumber);
}

console.log("Malformed phone numbers:");

_(people)
	.forEach(function(person){
		var mobilePhone = person.mobilePhone;
		var workPhone = person.workPhone;

		if(mobilePhone && !isValidPhoneNumber(mobilePhone)){
			console.warn("%s: %s", person.fullname, person.mobilePhone);
		}

		if(workPhone && !isValidPhoneNumber(workPhone)){
			console.warn("%s: %s", person.fullname, person.workPhone);
		}
	});
			
