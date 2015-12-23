# ngAutobahn
[![Build Status: Linux](http://img.shields.io/travis/ef-ctx/ngAutobahn/master.svg?style=flat-square)](https://travis-ci.org/ef-ctx/ngAutobahn)
[![Bower version](http://img.shields.io/bower/v/ngAutobahn.svg?style=flat-square)](git@github.com:ef-ctx/ngAutobahn.git)
angular modules for autobahn real time services over WAMP web socket protocol.

> ###DESCRIPTION###

Provides a simple and easy way to interact with real time services using WAMP protocol along with some useful features:

* **Restore the connection.** keeping subscribtions intact and resubscribing when regaining connection. Connection could be lost in 2 main cases:

  * Losing Socket connection due to a failure only in the socket layer:
    * Autobahn already provides this feature.

  * Losing Socket connection due to loss of Internet connection:
    * Chrome has an issue dropping socket connections when network connection dies. [Issue](https://code.google.com/p/chromium/issues/detail?id=76358)
      In this case we came up with a [Ping service](https://github.com/ef-ctx/ngAutobahn/tree/master/src/lib/ngAutobahn/utils/ping)
      which allow a promise returning function to be called repeatedly
      and if the promise is not resolved after a certain amount of time we disconnect and try to establish a new connection,
      using ping is not enabled by default but it is there to use in the case of need.

* **Simple way of interacting with WAMP**

  * **Perform an RPC call through the websocket layer.**
    * Handles opening connection under the hood if the connection is not opened.
    * Opens the connection and when it is opened it performs the rpc.
    * Returns a promise which resolves in the function response.

    ```javascript
    ngAutobahnSession.remoteCall('remoteMethodName', payload)
        .then(function (responsePayload) {
            console.log(responsePayload);
        });
    ```

  * **Subscribe to a channel.**
    * Handles opening connection under the hood if the connection is not opened.
    * Opens the connection and when it is opened it performs the subscription.
    * Returns a promise which resolves in a broker object to interact with the
      session providing methods for publish messages and subscribe handlers

    ```javascript
    var sessionBroker;

    ngAutobahnSession.subscribe('channelName')
        .then(function (broker){
            sessionBroker = broker;
        });

    sessionBroker.publish('myMessage', payload);

    function myHandler(responsePayload) {
        console.log(responsePayload);
    }

    sessionBroker.subscribe('myMessage', myHandler);
    ```

  * **Publish Message.**
    * Subscribe function returns a promise which resolves in a Broker object.
    * The broker object provides a `publish` method to publish messages.
    * The publish method returns a promise which will be resolved if the publishing succeed and rejected if it fails (eg. loosing connection).

    ```javascript
    var sessionBroker;

    ngAutobahnSession.subscribe('channelName')
        .then(function (broker){
            sessionBroker = broker;
        });

    sessionBroker.publish('myMessage', payload)
        .then(function () {
            console.log('message sent');
        }, function () {
            console.log('message failed');
        });
    ```

  * **Subscribe handler to a message.**
    * subscribe function returns a promise which resolves in a Broker object.
    * The broker object provides a `subscribe` method to subscribe handlers to messages
    * When subscribing to a message the handler will be called everytime the session receives that message in the subscribed channel.
    * If the connection drops the handlers won't be wiped out and they will be automatically resubscribed when restoring connection.

    ```javascript
    var sessionBroker;

    ngAutobahnSession.subscribe('channelName')
        .then(function (broker){
            sessionBroker = broker;
        });

    function myHandler(responsePayload) {
        console.log(responsePayload);
    }

    sessionBroker.subscribe('myMessage', myHandler);
    ```

### It is formed by 3 main modules:

* [ngAutobahn.connection](https://github.com/ef-ctx/ngAutobahn/tree/master/src/lib/ngAutobahn/connection)
* [ngAutobahn.session](https://github.com/ef-ctx/ngAutobahn/tree/master/src/lib/ngAutobahn/session)
* [ngAutobahn.messageBroker](https://github.com/ef-ctx/ngAutobahn/tree/master/src/lib/ngAutobahn/messageBroker)

### And a helper module
* [ngAutobahn.utils.ping](https://github.com/ef-ctx/ngAutobahn/tree/master/src/lib/ngAutobahn/utils/ping)

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

Clone this repository, install the dependencies and simply run `grunt`.

```
$ npm install -g grunt-cli bower
$ npm install
$ bower install
$ grunt
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
