const https = require('https')

console.log('sending request...')

https.get({
  hostname: 'c.bjn.mobi',
  path: '/docs/',
  port: 443,
  headers: {
    connection: 'close'
  }
}, function (res) {
  console.log(res.statusCode)
}).on('error', function (err) {
  console.error('error', err)
})
