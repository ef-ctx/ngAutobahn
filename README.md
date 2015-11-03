# ngAutobahn
angular modules for autobahn real time services over WAMP web socket protocol.

Provides a simple and easy way to interact with real time services using WAMP protocol.

## It is formed by 3 main modules:

* **ngAutobahn.connection** Including:
  * **ngAutobahnConnectionProvider** provider which provides a configurable service for the connection
  * **ngAutobahnConnection** services which provides:
    * openConnection method
    * closeConnection method
    * status constant
    * isOpened
    * isClosed
    * isLost

* **ngAutobahn.session**. Including:
  * **ngAutobahnSession** service which provides:
    * subscribe method subscribes to a channel and returns a broker object with methods to publish and subscribe messages in the channel.
    * remoteCall method performs an rpc call

## And a helper module

* **ngAutobahn.utils.ping**

# ngAutobahn
[![Build Status: Linux](http://img.shields.io/travis/ef-ctx/ngAutobahn/master.svg?style=flat-square)](https://travis-ci.org/ef-ctx/ngAutobahn)
[![Bower version](http://img.shields.io/bower/v/ngAutobahn.svg?style=flat-square)](git@github.com:ef-ctx/ngAutobahn.git)

> ###DESCRIPTION###

## Getting Started

Add **ngAutobahn** to you project.

Via bower:

```
$ bower install --save ngAutobahn
```

Via npm:

```
$ npm install --save ngAutobahn
```

Checkout the [full documentation](https://github.com/ef-ctx/ngAutobahn).


## Contributing

We'd love for you to contribute to our source code and to make it even better than it is today!

Make sure you read the [Contributing Guide](CONTRIBUTING.md) first.


## Developing

Clone this repository, install the dependencies and simply run `grunt develop`.

```
$ npm install -g grunt-cli bower
$ npm install
$ bower install
$ ./bootstrap.sh
$ grunt develop
```

At this point, the source examples included were built into the `build/` directory and a simple webserver is launched so
that you can browse the documentation, the examples and the code coverage.


## [MIT License](LICENSE)

[Copyright (c) 2015 EF CTX](https://raw.githubusercontent.com/EFEducationFirstMobile/oss/master/LICENSE)

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
