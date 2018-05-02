// Modules
const browserify = require('browserify')
const buffer = require('vinyl-buffer')
const gulp = require('gulp')
const less = require('gulp-less')
const minifyCSS = require('gulp-csso')
const source = require('vinyl-source-stream')
const sourcemaps = require('gulp-sourcemaps')

// LESS -> Minified CSS
gulp.task('css', () => {
  return gulp.src('src/less/exports/*.less')
    .on('error', (err) => { console.log('LESS / CSS error: ', err) })
    .pipe(less())
    .pipe(minifyCSS())
    .pipe(gulp.dest('public/styles'))
})

// Make Browserified admin.js
gulp.task('makeAdmin', () => {
  // set up the browserify instance on a task basis
  browserify({
    entries: 'src/scripts/client/admin.js',
    debug: true
  })
    .on('error', (err) => { console.log('makeAdminJS: ', err) })
    .transform('babelify', {plugins: ['lodash'], presets: ['es2015-ie']})
    .bundle()
    .pipe(source('admin.min.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./public/scripts/'))
})

// Make Browserified floorplan.js
gulp.task('makeFloorplan', () => {
  // set up the browserify instance on a task basis
  browserify({
    entries: 'src/scripts/client/floorplan.js',
    debug: true
  })
    .on('error', (err) => { console.log('makeFloorplanJS: ', err) })
    .transform('babelify', {plugins: ['lodash'], presets: ['es2015-ie']})
    .bundle()
    .pipe(source('floorplan.min.js'))
    .pipe(buffer())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest('./public/scripts/'))
})

// Do all the things!
gulp.task('default', [ 'css', 'makeAdmin', 'makeFloorplan' ])
  .on('error', (err) => { console.log('Default task error: ', err) })
