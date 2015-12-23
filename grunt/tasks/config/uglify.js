module.exports = {

    compile: {

        options: {
            banner: '<%= banner %>'
        },

        files: {
            '<%= dist.min %>': '<%= files.lib %>'
        }

    }

};
