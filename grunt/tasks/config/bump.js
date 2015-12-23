module.exports = {
    options: {
        files: [
            'package.json',
            'bower.json'
        ],
        commit: true,
        commitMessage: 'chore(release): v%VERSION%',
        commitFiles: [
            'package.json',
            'bower.json',
            'CHANGELOG.md',
            '<%= dist.js %>',
            '<%= dist.min %>'
        ],
        createTag: true,
        tagName: 'v%VERSION%',
        tagMessage: 'v%VERSION%',
        push: true,
        pushTo: 'origin'
    }

};
