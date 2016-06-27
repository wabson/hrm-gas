module.exports = function(config) {
    config.set({
        files: [
            'node_modules/jquery/dist/jquery.js',
            'node_modules/underscore/underscore.js',
            'node_modules/backbone/backbone.js',
            'src/**/*.client.js',
            'src/**/*.spec.js'
        ],

        frameworks: ['jquery-jasmine', 'jasmine', 'jquery-2.1.0'],

        browsers: ['Chrome'],

        // coverage reporter generates the coverage
        reporters: ['progress', 'coverage'],

        preprocessors: {
            // source files, that you wanna generate coverage for
            // do not include tests or libraries
            // (these files will be instrumented by Istanbul)
            'src/**/*.client.js': ['coverage']
        },

        // optionally, configure the reporter
        coverageReporter: {
            type : 'html',
            dir : 'coverage/'
        },

        singleRun: false
    });
};