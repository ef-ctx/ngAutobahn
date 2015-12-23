module.exports = function (grunt) {
    'use strict';

    grunt.registerTask('release', [
        'release-patch',
    ]);

    grunt.registerTask('release-patch', [
        'release-pre-tasks',
        'bump-only:patch',
        'release-post-tasks'
    ]);

    grunt.registerTask('release-minor', [
        'release-pre-tasks',
        'bump-only:minor',
        'release-post-tasks'
    ]);

    grunt.registerTask('release-major', [
        'release-pre-tasks',
        'bump-only:major',
        'release-post-tasks'
    ]);

    //--------------------------------------

    grunt.registerTask('release-pre-tasks', [
        'clean',
        'jshint',
        'karma:unit'
    ]);

    grunt.registerTask('release-post-tasks', [
        'update-pkg',
        'concat',
        'uglify',
        'conventionalChangelog',
        'bump-commit'
    ]);

    grunt.registerTask('update-pkg','',function () {
        grunt.config('pkg', grunt.file.readJSON('./package.json'));
    });

};
