var http		= require('http');
var fs			= require('fs');
var xpath		= require('xpath');
var DomParser	= require('xmldom').DOMParser;

var names = require('./names');

// http.globalAgent.maxSockets = 65535;


var linkedInCookies = 'visit="v=1&M"; JSESSIONID="ajax:0954010542991720294"; X-LI-IDC=C1; L1c=3bdd29c3; leo_auth_token="LIM:139463329:i:1379388797:e69c52dd2f8e07c8ae205da405a31b443764922a"; bcookie="v=2&63f1da8d-993b-4aae-95f5-7b3c34f20351"; __qca=P0-1000170917-1320732942736; _mobile=1340074652524; __utma=23068709.1347353848.1374797981.1374797981.1374816151.2; __utmz=23068709.1374797981.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none); __utmv=23068709.user; _leo_profile="u=139463329"; _lipt="0_PyLNzwYMM5yDx5njl3S1lCy2gvaUa7EJlPLlse-U6JglUFcRRy_DGNh8ME_6gbq3KLXj_0SQAYQXJFaRiIFHw9bL4I-rSolO_rrSkV2y722iZ7H7afKZwhp5piYDsf84F6JLFBjD2YHt2kj-7xF5pBhhTwn__rkS9Tr5DlnCclgsqo15Vn450XQzg-Ku_FlOdyzgA8rEYOkkB-WcbwbcLukEndTzbbquYNUwdtepHwGRlyEOy9Cak-d9BpRPTpfS"; sdsc=1%3A1SZM1shxDNbLt36wZwCgPgvN58iw%3D; lang="v=2&lang=en-us"';

function getResultsPath(fullname){
	return "/vsearch/p?keywords="+encodeURIComponent(fullname)+"&f_CC=1958201";
}

function getProfilePath(profileId){
	return "/profile/view?id="+profileId;
}

function getSource(path, callback){
	http.get({
		host: 'www.linkedin.com',
		path: path,
		headers: {
			cookie: linkedInCookies
		}
	}, function(res){
		var body = '';
		res.on('data', function(chunk){
			body += chunk;
		});
		res.on('end', function(){
			callback(body);
		});
	});
}

function getFirstResultPhotoSrc(source){
	var matches = source.match(/,"imageUrl":"(.+?)",/);

	if(matches){
		var thumbnailSrc = matches[1];
		//var fullSizeSrc = thumbnailSrc.replace(/media\.licdn\.com\/mpr\/mpr\/shrink_60_60/, 'm.c.lnkd.licdn.com/media');
		var fullSizeSrc = "http://m.c.lnkd.licdn.com/media"+thumbnailSrc;
		return fullSizeSrc;
	} else {
		return null;
	}
}

function saveUrlToDisk(url, filePath){
	if(!fs.existsSync(filePath)){
		var fileStream = fs.createWriteStream(filePath);
		http.get(url, function(res){
			console.log("GET "+url+": "+res.statusCode);
			res.on('data', function(chunk){
				fileStream.write(chunk);
			});
			res.on('end', function(){
//				fileStream.close();
				console.log(filePath, url);
			});
		});
	}
} 

function findProfileIdinSource(source){
	var matches = source.match(/\/profile\/view\?id=(\d+)&authType=NAME_SEARCH/);
	if(matches){
		return matches[1];
	} else {
		// console.warn("no results");
		return null;
	}
}

function findTitleInSource(source){
	// var matches = source.match(/"([^"]+) at Blue Jeans Network/);
	var matches = source.match(/"title_highlight":"(.+?)"/);
	if(matches){
		return matches[1];
	} else {
		return null;
	}
}

function logPerson(person){
	console.log([person.fullname, person.linkedInId, person.title].join('\t'));
}

function main(){
	names.forEach(function(fullname){
		var resultsUrl = getResultsPath(fullname);
		getSource(resultsUrl, function(resultsSource){
			var person = {};
			person.fullname = fullname;
			person.linkedInId = findProfileIdinSource(resultsSource);
			
			var photoPath = "photos/"+fullname+".jpg";
			if(!fs.existsSync(photoPath)){
				var photoUrl = getFirstResultPhotoSrc(resultsSource);
				photoUrl && saveUrlToDisk(photoUrl, photoPath);
			}

			if(person.linkedInId){
				var profileUrl = getProfilePath(person.linkedInId);
				getSource(profileUrl, function(profileSource){
					person.title = findTitleInSource(profileSource);
					logPerson(person);
				});
			} else {
				logPerson(person);
			}
		});
	});

	//save profile picture to disk
	/*names.forEach(function(fullname){
		var filePath = "photos/"+fullname+'.jpg';
		if(!fs.existsSync(filePath)){
			var resultsUrl = getResultsPath(fullname);
			getSource(resultsUrl, function(source){
				var photoUrl = getFirstResultPhotoSrc(source);
				photoUrl && saveUrlToDisk(photoUrl, filePath);
			});
		}
	});*/

	//get profile id
	/*names.forEach(function(fullname){
		var resultsUrl = getResultsPath(fullname);
		getSource(resultsUrl, function(source){
			var profileId = findProfileIdinSource(source);
			profileId && console.log(profileId, fullname);
		});
	});*/

	/*var remaining = merged.length;

	merged.forEach(function(person){
		if(person.linkedInId){
			var profileUrl = getProfilePath(person.linkedInId);
			getSource(profileUrl, function(profileSource){
				console.log(person.fullname+'...');
				var title = findTitleInSource(profileSource);
				if(title){
					person.title = title;
				}
				if(!(--remaining)){
					console.log(JSON.stringify(merged));
				}
			});
		} else {
			--remaining;
		}
	});*/
	
}

main();
