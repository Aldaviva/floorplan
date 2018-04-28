var http = require('https')
var fs = require('fs')
// var xpath = require('xpath')
// var DomParser = require('xmldom').DOMParser

var names = require('./names')

// http.globalAgent.maxSockets = 65535;

var linkedInCookies = 'visit="v=1&M"; X-LI-IDC=C1; L1c=5eba1285; L1l=6a2dc915; L1e=490f7d02; li_at="AQEBAQhQCqEAAAAVAAABQWHAcZEAAAFBYqSfICshNYsNcm4SEnUvO3HQ96axQdDbQtFAWt4WJWR-kDI8apD6O_rs9zBlOhME_HzqHBv_2Qfc2n25S0IoEyueARjP89pbhX4xRLy2jDTHOw7G27t_8A"; JSESSIONID="ajax:3007999833798756573"; bcookie="v=2&63f1da8d-993b-4aae-95f5-7b3c34f20351"; __qca=P0-1000170917-1320732942736; _mobile=1340074652524; _leo_profile="u=139463329"; __utma=23068709.1347353848.1374797981.1374816151.1380324500.3; __utmc=23068709; __utmz=23068709.1380324500.3.2.utmcsr=developer.linkedin.com|utmccn=(referral)|utmcmd=referral|utmcct=/documents/authentication; __utmv=23068709.user; _lipt="0_cUHYoUfcc1oFUhlQRgZwlpEwA7OK2xWblsXRn3LK1Hk5uajdtoLVWIkicafNA2SwNO7Q4_I9T9SHmlNQNRtzzzeEuCde0VXcQlKNFyEP4wz16KkRDZlW2DgzZicOp1mNlhhTwn__rkS9Tr5DlnCclgsqo15Vn450XQzg-Ku_FlOdyzgA8rEYOkkB-WcbwbcLukEndTzbbquYNUwdtepHwGRlyEOy9Cak-d9BpRPTpfS"; RT=s=1380332264708&r=http%3A%2F%2Fwww.linkedin.com%2Fprofile%2Fview%3Fid%3D81170710; lang="v=2&lang=en-us&c="'

function getResultsPath (fullname) {
  return '/vsearch/p?keywords=' + encodeURIComponent(fullname) + '&f_CC=1958201'
}

function getProfilePath (profileId) {
  return '/profile/view?id=' + profileId
}

function getSource (path, callback) {
  http.get({
    host: 'www.linkedin.com',
    path: path,
    headers: {
      cookie: linkedInCookies
    }
  }, function (res) {
    var body = ''
    res.on('data', function (chunk) {
      body += chunk
    })
    res.on('end', function () {
      callback(body)
    })
  })
}

function getFirstResultPhotoSrc (source) {
  var matches = source.match(/,"imageUrl":"(.+?)",/)

  if (matches) {
    var thumbnailSrc = matches[1]
    // var fullSizeSrc = thumbnailSrc.replace(/media\.licdn\.com\/mpr\/mpr\/shrink_60_60/, 'm.c.lnkd.licdn.com/media');
    var fullSizeSrc = 'http://m.c.lnkd.licdn.com/media' + thumbnailSrc
    return fullSizeSrc
  } else {
    return null
  }
}

function saveUrlToDisk (url, filePath) {
  if (!fs.existsSync(filePath)) {
    var fileStream = fs.createWriteStream(filePath)
    http.get(url, function (res) {
      console.log('GET ' + url + ': ' + res.statusCode)
      res.on('data', function (chunk) {
        fileStream.write(chunk)
      })
      res.on('end', function () {
        //        fileStream.close();
        console.log(filePath, url)
      })
    })
  }
}

function findProfileIdinSource (source) {
  var matches = source.match(/\/profile\/view\?id=(\d+)&authType=NAME_SEARCH/)
  if (matches) {
    return matches[1]
  } else {
    // console.warn("no results");
    return null
  }
}

function findTitleInSource (source) {
  // var matches = source.match(/"([^"]+) at Blue Jeans Network/);
  var matches = source.match(/"title_highlight":"(.+?)"/)
  if (matches) {
    return matches[1]
  } else {
    return null
  }
}

function logPerson (person) {
  console.log([person.fullname, person.linkedInId, person.title].join('\t'))
}

function main () {
  names.forEach((fullname) => {
    var resultsUrl = getResultsPath(fullname)
    getSource(resultsUrl, function (resultsSource) {
      var person = {}
      person.fullname = fullname
      person.linkedInId = findProfileIdinSource(resultsSource)

      var photoPath = 'photos/' + fullname + '.jpg'
      if (!fs.existsSync(photoPath)) {
        var photoUrl = getFirstResultPhotoSrc(resultsSource)
        photoUrl && saveUrlToDisk(photoUrl, photoPath)
      }

      if (person.linkedInId) {
        var profileUrl = getProfilePath(person.linkedInId)
        getSource(profileUrl, function (profileSource) {
          person.title = findTitleInSource(profileSource)
          logPerson(person)
        })
      } else {
        logPerson(person)
      }
    })
  })

  // save profile picture to disk
  /* names.forEach(function(fullname){
    var filePath = "photos/"+fullname+'.jpg';
    if(!fs.existsSync(filePath)){
      var resultsUrl = getResultsPath(fullname);
      getSource(resultsUrl, function(source){
        var photoUrl = getFirstResultPhotoSrc(source);
        photoUrl && saveUrlToDisk(photoUrl, filePath);
      });
    }
  }); */

  // get profile id
  /* names.forEach(function(fullname){
    var resultsUrl = getResultsPath(fullname);
    getSource(resultsUrl, function(source){
      var profileId = findProfileIdinSource(source);
      profileId && console.log(profileId, fullname);
    });
  }); */

  /* var remaining = merged.length;

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
  }); */
}

main()
