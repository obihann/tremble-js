var gulp = require('gulp');
var gutil = require('gulp-util');
var watch = require('gulp-watch');
var jshint = require('gulp-jshint');
var batch = require('gulp-batch');
var coffee = require('gulp-coffee');
var coffeelint = require('gulp-coffeelint');
var stylish = require('coffeelint-stylish');

// coffeescript linting
gulp.task('coffeelint', function () {
  gulp.src('./src/tests/*.coffee')
  .pipe(coffeelint())
  .pipe(coffeelint.reporter(stylish))
  .pipe(coffeelint.reporter('fail'));

  gulp.src('./src/tremble/*.coffee')
  .pipe(coffeelint())
  .pipe(coffeelint.reporter(stylish))
  .pipe(coffeelint.reporter('fail'));
});
// js linting
gulp.task('lint', function() {
  gulp.src('src/*.js')
  .pipe(jshint())
  .pipe(jshint.reporter('jshint-stylish'))
  .pipe(jshint.reporter('fail'));

  gulp.src('tests/*.js')
  .pipe(jshint())
  .pipe(jshint.reporter('jshint-stylish'))
  .pipe(jshint.reporter('fail'));
});

// coffeescript build
gulp.task('coffee', function() {
  gulp.src('src/tests/*.coffee')
  .pipe(coffee({bare: true}).on('error', gutil.log))
  .pipe(gulp.dest('tests/'));

  gulp.src('src/tremble/*.coffee')
  .pipe(coffee({bare: true}).on('error', gutil.log))
  .pipe(gulp.dest('bin/'));
});

// watch all js files for change
gulp.task('watch', function () {
  watch('bin/*.js', batch(function (events, done) {
    gulp.start('lint', done);
  }));

  watch('src/tests/*.coffee', batch(function (events, done) {
    gulp.start('coffee', done);
  }));

  watch('src/tremble/*.coffee', batch(function (events, done) {
    gulp.start('coffee', done);
  }));
});

gulp.task('default', ['coffeelint', 'coffee', 'lint'], function() {
});
