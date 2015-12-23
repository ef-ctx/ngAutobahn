module.exports = {

    options: {
        livereload: false
    },

    gruntfile: {
        files: 'Gruntfile.js',
        tasks: ['jshint:gruntfiles'],
    },

    lib: {
        files: [
            '<%= files.lib %>'
        ],
        tasks: ['jshint:src', 'karma:unit', 'concat']
    },

    test: {
        files: ['<%= files.test %>'],
        tasks: ['jshint:test', 'karma:unit']
    }

};
