module.exports = function (grunt) {
    'use strict';

    grunt.registerTask('travis', [
        'clean',
        'jshint',
        'karma:unit'
    ]);

};
