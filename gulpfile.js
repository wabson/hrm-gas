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

var clientJsFilesGlob = '**/*.@(client|spec).js';
var cssFilesGlob = '**/*.css';

// Runs the copy-latest task, then calls gapps upload in the correct
// configuration directory based on the target environment
gulp.task('upload-latest', ['compile-latest'], shell.task(['../../node_modules/node-google-apps-script/bin/gapps upload'],
    {cwd: buildRoot}));

// Compiles all HTML files by processing build-time includes
gulp.task('compile-latest', ['copy-latest'], function() {
    var clientExcludes = options.env === 'local' ? '' : clientJsFilesGlob;
    return gulp.src(dstRoot + '/**')
        .pipe(include({
            includePaths: dstRoot,
            hardFail: false
        }))
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
            cssRoot + '/ui/' + cssFilesGlob,
            srcRoot + '/ui/' + cssFilesGlob,
            srcRoot + '/ui/' + clientJsFilesGlob,
            srcRoot + '/ui/**/*.html']);

    // Emulate runtime includes for local env and replace JS libs with local equivalents
    return options.env === 'local' ? src
            .pipe(replace(/<\?!= ?include\('([-\.\/\w]+)'\);? ?\?>/g, '<!--=include $1.html -->'))
            .pipe(replace('https://ssl.gstatic.com/docs/script/css', ''))
            .pipe(replace('//ajax.googleapis.com/ajax/libs/jquery/3.0.0', '/jquery/dist/'))
            .pipe(replace('//cdnjs.cloudflare.com/ajax/libs/underscore.js/1.8.3', '/underscore/'))
            .pipe(replace('//cdnjs.cloudflare.com/ajax/libs/backbone.js/1.3.3', '/backbone/'))
            .pipe(gulp.dest(dstRoot))
        : src.pipe(gulp.dest(dstRoot));
});

// Does any environment specific work
gulp.task('copy-environment-specific-code', function copyEnvironmentSpecific() {
    var envFiles = srcRoot + '/env/' + options.env + '/*.js';
    var mockFiles = testRoot + '/ui/**/*.@(html|client.js)';
    var testFiles = srcRoot + '/tests/*.js';
    var unitTestRunner = srcRoot + '/unit-tests.html';
    switch (options.env) {
        case 'local':
            return gulp.src([envFiles, mockFiles, unitTestRunner])
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
        //cssRoot + '/**/*'
    ]);
});

gulp.task('clean-deployments', function(cb) {
    return del('build/*/@(src|includes|css)');
});

gulp.task('lint', function() {
    return gulp.src(srcRoot + '/**/*.js')
        .pipe(jshint.extract())
        .pipe(jshint())
        .pipe(jshint.reporter('jshint-stylish', {
            verbose: true
        }));
});

gulp.task('sass', function () {
    return gulp.src(srcRoot + '/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(gulp.dest(cssRoot));
});

gulp.task('ui-server', ['lint', 'compile-latest'], function() {
    return gulp.src([compileRoot, 'node_modules', 'coverage'])
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
    gulp.watch([srcRoot + '/ui/**/*.html', srcRoot + '/ui/' + clientJsFilesGlob, srcRoot + '/ui/**/*.scss', testRoot + '/ui/**/*.html'], ['lint', 'compile-latest']);
});

gulp.task('ui-server-watch', ['ui-server', 'watch']);