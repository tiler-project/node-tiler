var gulp = require('gulp');
var runSequence = require('run-sequence');
var del = require('del');
var changed = require('gulp-changed');
var react = require('gulp-react');
var bump = require('gulp-bump');
var spawn = require('child_process').spawn;

var paths = {
  components: 'components/**/*.jsx',
  build: 'build'
};

gulp.task('clean', function(done) {
  del([paths.build], done);
});

gulp.task('transpile', function() {
  return gulp.src(paths.components)
    .pipe(changed(paths.build))
    .pipe(react({harmony: true}))
    .pipe(gulp.dest(paths.build));
});

gulp.task('watch', function() {
  gulp.watch(paths.components, ['transpile']);
});

gulp.task('build', function(done) {
  runSequence(
    'clean',
    ['transpile'],
    done);
});

gulp.task('bump', function(){
  gulp.src('package.json')
    .pipe(bump())
    .pipe(gulp.dest('./'));
});

gulp.task('npm-publish', function (done) {
  spawn('npm', ['publish'], { stdio: 'inherit' }).on('close', done);
});

gulp.task('release', function(done) {
  runSequence(
    'build',
    'npm-publish',
    done);
});

gulp.task('default', ['watch', 'build']);
