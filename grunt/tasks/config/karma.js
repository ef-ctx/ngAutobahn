module.exports = {

    unit: {
        singleRun: true,
        reporters: ['dots', 'coverage'],
        browsers: [
            'PhantomJS'
        ]
    },

    debug: {
        singleRun: false,
        reporters: ['dots'],
        browsers: [
            'Chrome'
        ]
    },

    options: {
        basePath: './',

        files: [
            '<%= files.vendor %>',
            '<%= files.testVendor %>',
            '<%= files.lib %>'
        ],

        preprocessors: {
            'src/**/*.js': 'coverage'
        },

        frameworks: ['jasmine'],

        plugins: ['karma-jasmine', 'karma-coverage', 'karma-chrome-launcher', 'karma-phantomjs-launcher'],

        reporters: ['dots', 'covergae'],

        urlRoot: '/',

        autoWatch: false,

        client: {
            captureConsole: true
        },

        singleRun: true,

        browsers: [
            'PhantomJS'
        ]
    }

};
