#!/bin/bash

# install global dependencies
npm cache clear && rm -rf node_modules && npm install
npm install -g grunt-cli bower

# checks node, npm, bower & grunt-cli version
./bin/systemcheck.sh
check=$?
if [[ $check > 0 ]]
then
    exit $check;
fi

# ci tasks
# bower cache clean
# bower update &&
grunt ci
