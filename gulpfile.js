// Modules
const babel = require('gulp-babel')
const gulp = require('gulp')
const less = require('gulp-less')
const minifyCSS = require('gulp-csso')
const minifyJS = require('gulp-minify')
const sourcemaps = require('gulp-sourcemaps')

// LESS -> Minified CSS
gulp.task('css', () => {
  return gulp.src('src/less/exports/*.less')
    .pipe(less())
    .pipe(minifyCSS())
    .pipe(gulp.dest('public/styles'))
})

// Provision backend libraries
gulp.task('libjs', () => {
  return gulp.src('src/scripts/lib/*.js')
    .pipe(sourcemaps.init())
    .pipe(minifyJS({
      ext: {min: '.js'},
      ignoreFiles: ['.min.js']
    }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('public/scripts/lib'))
})

// Process client JS through Babel & publish
gulp.task('clientjs', () =>
  gulp.src('src/scripts/client/*.js')
    .pipe(sourcemaps.init())
    .pipe(babel({
      presets: [['env', { 'targets': {
        'browsers': ['last 2 versions', 'safari >= 7']
      }}]]
    }))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('public/scripts/client'))
)

// Ensure RequireJS is in place
gulp.task('requirejs', () => {
  return gulp.src('src/scripts/*.js')
    .pipe(gulp.dest('public/scripts'))
})

// Do all the things!
gulp.task('default', [ 'css', 'libjs', 'clientjs', 'requirejs' ])
