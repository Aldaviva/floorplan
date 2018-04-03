// Starting directory should match root directory in config file
process.chdir(__dirname)

require('nodemon')({
  script: 'lib/app.js',
  ext: 'js json hbs svg css',
  on: [
    'start', function () { console.log('Started Floorplan') },
    'quit', function () { process.exit() },
    'restart', function (files) { console.log('App restarted due to: ', files) }
  ]
})
