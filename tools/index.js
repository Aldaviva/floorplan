var http		= require('http');
var fs			= require('fs');
var xpath		= require('xpath');
var DomParser	= require('xmldom').DOMParser;

var names = require('./names');
var merged = require('./merged');

// http.globalAgent.maxSockets = 65535;


var linkedInCookies = 'visit="v=1&M"; X-LI-IDC=C1; JSESSIONID="ajax:7590970351728811367"; L1e=495eba97; L1c=3fde14c3; L1l=6896d72d; leo_auth_token="LIM:139463329:a:21600:1369420544:9934bc2e0d892e4d5c715d6e7855bb4b8efcd159"; srchId=fc029ada-ffb9-4494-bc7f-832d20bfbf07-1; NSC_MC_QH_MFP=ffffffffaf100bb645525d5f4f58455e445a4a4219d9; bcookie="v=2&63f1da8d-993b-4aae-95f5-7b3c34f20351"; __qca=P0-1000170917-1320732942736; _mobile=1340074652524; _leo_profile="u=139463329"; __utma=23068709.1701420679.1320732942.1358494264.1369367907.7; __utmc=23068709; __utmz=23068709.1340058883.4.2.utmcsr=Profile_inmail|utmccn=Subs|utmcmd=onsite; __utmv=23068709.guest; sdsc=1%3A1SZM1shxDNbLt36wZwCgPgvN58iw%3D; RT=s=1369420562469&r=http%3A%2F%2Fwww.linkedin.com%2Fsearch%2Ffpsearch%3Fkeywords%3DAkshay%2520Kumar%2520Sridharan%26companyId%3D1958201; _lipt="0_f5plwBwf_EGvIAKGcevMRXjOj8nYOVTSSIll0bIRdBWcCCqQhhTOF-fiHwuGHboxNzDhFXP-O4Z5V3yc3IXul1kMm9SGOmCGf8lg6OGKgePF1BuXE0CpmiId1ttOtmJh1IFlFQUsRxhOgZnnMJwjdQsqo15Vn450XQzg-Ku_FlOdyzgA8rEYOkkB-WcbwbcLukEndTzbbquYNUwdtepHwGRlyEOy9Cak-d9BpRPTpfS"; lang="v=2&lang=en-us&c="';

function getResultsPath(fullname){
	return "/search/fpsearch?keywords="+encodeURIComponent(fullname)+"&companyId=1958201";
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
	var matches = source.match(/<img src="(.+?)" class="photo"/);

	if(matches){
		var thumbnailSrc = matches[1];
		var fullSizeSrc = thumbnailSrc.replace(/media\.licdn\.com\/mpr\/mpr\/shrink_60_60/, 'm.c.lnkd.licdn.com/media');
		return fullSizeSrc;
	} else {
		return null;
	}
}

function saveUrlToDisk(url, filePath){
	if(!fs.existsSync(filePath)){
		var fileStream = fs.createWriteStream(filePath);
		http.get(url, function(res){
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

function main(){
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

	/*names.forEach(function(fullname){
		var resultsUrl = getResultsPath(fullname);
		getSource(resultsUrl, function(source){
			var profileId = findProfileIdinSource(source);
			profileId && console.log(profileId, fullname);
		});
	});*/

	var remaining = merged.length;

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
	});
	
}

main();
