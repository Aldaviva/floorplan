const fs = require('fs')
const http = require('https')
const path = require('path')
const mongo = require('mongodb')

process.chdir(__dirname)

// fs.mkdirSync(global.dirPhotos);

const linkedInCookies = 'visit="v=1&M"; X-LI-IDC=C1; L1c=5eba1285; L1l=6a2dc915; L1e=490f7d02; li_at="AQEBAQhQCqEAAAAVAAABQWHAcZEAAAFBYqSfICshNYsNcm4SEnUvO3HQ96axQdDbQtFAWt4WJWR-kDI8apD6O_rs9zBlOhME_HzqHBv_2Qfc2n25S0IoEyueARjP89pbhX4xRLy2jDTHOw7G27t_8A"; JSESSIONID="ajax:3007999833798756573"; bcookie="v=2&63f1da8d-993b-4aae-95f5-7b3c34f20351"; __qca=P0-1000170917-1320732942736; _mobile=1340074652524; _leo_profile="u=139463329"; __utma=23068709.1347353848.1374797981.1374816151.1380324500.3; __utmc=23068709; __utmz=23068709.1380324500.3.2.utmcsr=developer.linkedin.com|utmccn=(referral)|utmcmd=referral|utmcct=/documents/authentication; __utmv=23068709.user; _lipt="0_cUHYoUfcc1oFUhlQRgZwlpEwA7OK2xWblsXRn3LK1Hk5uajdtoLVWIkicafNA2SwNO7Q4_I9T9SHmlNQNRtzzzeEuCde0VXcQlKNFyEP4wz16KkRDZlW2DgzZicOp1mNlhhTwn__rkS9Tr5DlnCclgsqo15Vn450XQzg-Ku_FlOdyzgA8rEYOkkB-WcbwbcLukEndTzbbquYNUwdtepHwGRlyEOy9Cak-d9BpRPTpfS"; RT=s=1380332264708&r=http%3A%2F%2Fwww.linkedin.com%2Fprofile%2Fview%3Fid%3D81170710; lang="v=2&lang=en-us&c="'

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
    global.logger.log('info', res.statusCode, path)
    let body = ''
    res.on('data', function (chunk) {
      body += chunk
    })
    res.on('end', function () {
      callback(body)
    })
  })
}

function saveUrlToDisk (url, filePath, callback) {
  if (!fs.existsSync(filePath)) {
    const fileStream = fs.createWriteStream(filePath)
    http.get(url, function (res) {
      global.logger.log('info', 'GET ' + url + ': ' + res.statusCode)
      res.on('data', function (chunk) {
        fileStream.write(chunk)
      })
      res.on('end', function () {
        // console.log(filePath, url);
        callback && callback()
      })
    })
  }
}

mongo.MongoClient.connect('mongodb://localhost:27017/floorplan', function (err, db) {
  if (err) global.logger.log('error', err)
  db.collection('people', function (err, coll) {
    if (err) global.logger.log('error', err)
    coll.find({ office: 'blr', linkedInId: { $exists: true } }, function (err, cursor) {
      if (err) global.logger.log('error', err)
      cursor.each(function (err, person) {
        if (err) global.logger.log('error', err)
        if (person == null) {
          db.close()
          return
        }

        const photoFilename = path.join(global.dirPhotos, person._id + '.jpg')

        if (!fs.existsSync(photoFilename)) {
          getSource(getProfilePath(person.linkedInId), function (profileSource) {
            const photoUrl = profileSource.match(/"img_raw":"(.+?)"/)
            if (photoUrl) {
              saveUrlToDisk(photoUrl[1], photoFilename)
            } else {
              global.logger.log('info', person.fullname + " doesn't have a LinkedIn photo.")
            }
          })
        } else {
          global.logger.log('info', person.fullname + ' already has a photo, skipping.')
        }
      })
    })
  })
})
