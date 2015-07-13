var gulp = require('gulp');
var gutil = require('gulp-util');
var watch = require('gulp-watch');
var jshint = require('gulp-jshint');
var batch = require('gulp-batch');
var coffee = require('gulp-coffee');
var mocha = require('gulp-mocha');

gulp.task('mocha', function () {
    gulp.src('tests/tremble.js', {read: false})
        .pipe(mocha('spec'))
        .once('error', function () {
            process.exit(1);
        })
        .once('end', function () {
            process.exit();
        });
});

gulp.task('lint', function() {
      return gulp.src('src/*.js').pipe(jshint());
});

gulp.task('coffee', function() {
  gulp.src('src/*.coffee')
    .pipe(coffee({bare: true}).on('error', gutil.log))
    .pipe(gulp.dest('tremble/'));
});

gulp.task('watch', function () {
    watch('tremble/*.js', batch(function (events, done) {
        gulp.start('lint', done);
    }));

    watch('src/*.coffee', batch(function (events, done) {
        gulp.start('coffee', done);
    }));
});

gulp.task('default', ['coffee', 'lint'], function() {
});
 
gulp.task('test', ['mocha'], function() {
});
