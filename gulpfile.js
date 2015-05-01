var gulp = require('gulp');
var react = require('gulp-react');

var paths = {
  components: 'components/**/*.jsx'
};

gulp.task('transpile', function() {
  return gulp.src(paths.components)
    .pipe(react({harmony: true}))
    .pipe(gulp.dest('build'));
});

gulp.task('watch', function() {
  gulp.watch(paths.components, ['transpile']);
});


gulp.task('default', ['watch', 'transpile']);
