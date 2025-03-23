const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const cleanCSS = require('gulp-clean-css');
const rename = require('gulp-rename');


gulp.task('sass', function () {
    return gulp.src('scss/pages/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(cleanCSS())
        .pipe(rename({ extname: '.css' }))
        .pipe(gulp.dest('css/pages'));
});


gulp.task('watch', function () {
    gulp.watch('scss/pages/*.scss', gulp.series('sass'));
});