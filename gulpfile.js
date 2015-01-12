var gulp = require('gulp'),
	connect = require('gulp-connect'),
	watch = require('gulp-watch'),
	compass = require('gulp-compass'),
	amdOptimize = require('amd-optimize'),
	concat = require('gulp-concat'),
	uglify = require('gulp-uglify'),
	jshint = require('gulp-jshint'),
	paths = {
		html: './*.html',
		sass: './docs/css/src/**/*.scss',
		js: './docs/js/*.js',
		mindreader: './js/mindreader-vanilla.js'
	};

gulp.task('webserver', function() {
	connect.server({
		port: 1234,
		livereload: true
	});
});

gulp.task('watch', function() {
	gulp.watch(paths.sass, ['compass']);
	gulp.watch(paths.html, ['html']);
	gulp.watch([paths.js, './js/mindreader-vanilla.js'], ['requirejs']);
});

gulp.task('compass', function() {
	gulp.src(paths.sass)
		.pipe(compass({
			config_file: 'docs/config.rb',
			css: 'docs/css',
			sass: 'docs/css/src'
		}))
		.pipe(connect.reload());
});

gulp.task('jshint', function() {
	gulp.src(paths.mindreader)
		.pipe(jshint())
		.pipe(jshint.reporter('default'));
});

gulp.task('requirejs', ['jshint'], function() {
	return gulp.src(paths.js)
	.pipe(jshint())
	.pipe(jshint.reporter('default'))
	.pipe(amdOptimize('demo-basic'))
	.pipe(concat('demo-basic.min.js'))
	//.pipe(uglify())
	.pipe(gulp.dest('./docs/js/min'))
	.pipe(connect.reload());
});

gulp.task('html', function() {
	gulp.src(paths.html)
		.pipe(connect.reload());
});

gulp.task('default', ['compass', 'requirejs', 'webserver', 'watch']);