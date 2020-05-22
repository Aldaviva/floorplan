// Starting directory should match root directory in config file

require('@swc/register')

require('nodemon')({
  script: 'src/server/app.js',
  ext: 'js json hbs svg css',
  on: [
    'start', () => { console.log('Started Floorplan') },
    'quit', () => { process.exit() },
    'restart', (files) => { console.log('App restarted due to: ', files) }
  ]
})
