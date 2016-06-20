// Copyright 2015 Google Inc. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

var gulp = require('gulp');
var jshint = require('gulp-jshint');
var shell = require('gulp-shell');
var minimist = require('minimist');
var rename = require('gulp-rename');
var debug = require('gulp-debug');
var del = require('del');
var replace = require('gulp-replace');
var path = require('path');
var include = require('gulp-include');
var webserver = require('gulp-webserver');
var flatten = require('gulp-flatten');
var sass = require('gulp-sass');
var gulpIgnore = require('gulp-ignore');

// minimist structure and defaults for this task configuration
var knownOptions = {
    string: ['env'],
    'default': {
        env: 'local'
    }
};
var options = minimist(process.argv.slice(2), knownOptions);

// The root working directory where code is edited
var srcRoot = 'src';
var testRoot = 'test';
// The root staging folder for gapps configurations
var buildRoot = 'build/' + options.env;
var dstRoot = buildRoot + '/src';
var compileRoot = buildRoot + '/includes';
var cssRoot = buildRoot + '/css';

// Runs the copy-latest task, then calls gapps upload in the correct
// configuration directory based on the target environment
gulp.task('upload-latest', ['compile-latest'], shell.task(['../../node_modules/node-google-apps-script/bin/gapps upload'],
    {cwd: buildRoot}));

// Compiles all HTML files by processing build-time includes
gulp.task('compile-latest', ['copy-latest'], function() {
    var clientExcludes = '**/*.client.js';
    return gulp.src(dstRoot + '/**')
        .pipe(include())
        .pipe(gulpIgnore.exclude(clientExcludes))
        .pipe(gulp.dest(compileRoot))
});

// Copies all files based on the current target environment.
// Completion of "clean-deployment" is a prerequisite for starting the copy
// process.
gulp.task('copy-latest', ['clean-deployment', 'sass', 'copy-code']);
gulp.task('copy-code', ['copy-server-code', 'copy-client-code', 'copy-environment-specific-code']);

// Copies all .js that will be run by the Apps Script runtime
gulp.task('copy-server-code', function copyServerCode() {
    return gulp.src([
            srcRoot + '/server/*.js',
            srcRoot + '/libs/*.js',
            srcRoot + '/ui/**/*.server.js'])
        .pipe(gulp.dest(dstRoot));
});

gulp.task('copy-client-code', function copyClientCode() {

    var src = gulp.src([
            cssRoot + '/ui/**/*.css',
            srcRoot + '/ui/**/*.client.js',
            srcRoot + '/ui/**/*.html']);

    // Emulate runtime includes for local env
    return options.env === 'local' ? src
            .pipe(replace(/<\?!= ?include\('([-\.\/\w]+)'\);? ?\?>/g, '<!--=include $1.html -->'))
            .pipe(gulp.dest(dstRoot))
        : src.pipe(gulp.dest(dstRoot));
});

// Does any environment specific work
gulp.task('copy-environment-specific-code', function copyEnvironmentSpecific() {
    var envFiles = srcRoot + '/env/' + options.env + '/*.js';
    var mockFiles = testRoot + '/ui/**/*.html';
    var testFiles = srcRoot + '/tests/*.js';
    switch (options.env) {
        case 'local':
            return gulp.src([envFiles, mockFiles])
                .pipe(gulp.dest(dstRoot));

        case 'dev':
            break;

        case 'test':
            return gulp.src([envFiles, testFiles])
                .pipe(gulp.dest(dstRoot));
            break;

        default:
            break;
    }

    return gulp.src(envFiles).pipe(gulp.dest(dstRoot));
});

gulp.task('clean-deployment', function(cb) {
    return del([
        dstRoot + '/**/*',
        compileRoot + '/**/*'
    ]);
});

gulp.task('clean-deployments', function(cb) {
    return del([
        'build/local/src/**/*',
        'build/dev/src/**/*',
        'build/test/src/**/*' ,
        'build/prod/src/**/*',
        'build/local/includes/**/*',
        'build/dev/includes/**/*',
        'build/test/includes/**/*',
        'build/prod/includes/**/*'
    ]);
});

gulp.task('lint', function() {
    return gulp.src(srcRoot + '/**/*.js')
        .pipe(jshint.extract())
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish'));
});

gulp.task('sass', function () {
    return gulp.src(srcRoot + '/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest(cssRoot));
});

gulp.task('ui-server', ['lint', 'compile-latest'], function() {
    return gulp.src(compileRoot)
        .pipe(webserver({
            livereload: true,
            directoryListing: {
                enable: true,
                path: compileRoot
            },
            open: false
        }));
});

gulp.task('watch', function() {
    gulp.watch([srcRoot + '/ui/**/*.html', srcRoot + '/ui/**/*.client.js', srcRoot + '/ui/**/*.css', testRoot + '/ui/**/*.html'], ['lint', 'compile-latest']);
});

gulp.task('ui-server-watch', ['ui-server', 'watch']);