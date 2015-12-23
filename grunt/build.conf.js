module.exports = {

    build: {
        root: 'build/',
        js: 'build/src/**/*.js'
    },

    dist: {
        js: 'dist/<%= pkg.name %>.js',
        min: 'dist/<%= pkg.name %>.min.js'
    },

    coverage: {
        root: 'coverage'
    },

    // SOURCES

    files: {

        lib: ['src/**/*.js', '!src/**/*.spec*.js'],

        grunt: ['Gruntfile.js', 'grunt/**/*.js'],

        test: ['src/**/*.spec*.js'],

        vendor: 'vendor/angular/angular.js',

        testVendor: 'vendor/angular-mocks/angular-mocks.js'

    },

    banner: '/**********************************************************' +
            '\n * ' +
            '\n * <%= pkg.name %> - v<%= pkg.version %>' +
            '\n * ' +
            '\n * Release date : <%= grunt.template.today("yyyy-mm-dd : HH:MM") %>' +
            '\n * Author       : <%= pkg.author %> ' +
            '\n * License      : <%= pkg.license %> ' +
            '\n * ' +
            '\n **********************************************************/' +
            '\n\n\n\n'

};
