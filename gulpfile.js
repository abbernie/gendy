var gulp = require('gulp'),
	eslint = require('gulp-eslint'),
	webserver = require('gulp-webserver');

gulp.task('lint', function () {
	return gulp.src(['**/*.js'])
        .pipe(eslint())
        .pipe(eslint.format())
        .pipe(eslint.failAfterError());
});

gulp.task('webserver', function() {
	gulp.src('./')
		.pipe(webserver({
			livereload: true,
			directoryListing: false,
			fallback: 'index.html',
			open: true
	}));
});

gulp.task('default', ['lint', 'webserver']);
