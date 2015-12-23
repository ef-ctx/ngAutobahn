module.exports = function (grunt) {
    'use strict';

    var config = {
            pkg: grunt.file.readJSON('./package.json')
        },
        buildConfig = require('./grunt/build.conf.js'),
        loadConfig = function (path) {
            var glob = require('glob'),
                object = {},
                key;

            glob.sync('*', {
                cwd: path
            }).forEach(function (option) {
                key = option.replace(/\.js$/, '');
                object[key] = require(path + option);
            });
            return object;
        };
    require('load-grunt-tasks')(grunt);

    grunt.util._.extend(config, buildConfig);
    grunt.util._.extend(config, loadConfig('./grunt/tasks/config/'));

    grunt.initConfig(config);

    grunt.loadTasks('grunt/tasks');
};
