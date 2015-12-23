module.exports = function (grunt) {
    'use strict';

    grunt.registerTask('default', [
        'clean',
        'jshint',
        'karma:unit',
        'watch'
    ]);

};
