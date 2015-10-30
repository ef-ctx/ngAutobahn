describe('cxSocketSession', function () {
    /*'use strict';

    var $q,
        $timeout,
        $rootScope,
        CXSOCKET_CONNECTION_EVENTS,
        channelHandlers = {},
        autobahn = {
            session: {
                subscribe: function (channel, fn) {
                    var defer = $q.defer();
                    subscribeToChannel(channel, fn);
                    defer.resolve({});
                    return defer.promise;
                },
                call: function () {
                    var defer = $q.defer();
                    defer.resolve();
                    return defer.promise;
                },
                publish: function () {
                    var defer = $q.defer();
                    defer.resolve();
                    return defer.promise;
                },
                unsubscribe: function () {}
            }
        },
        handlers = {
            success: function () {},
            error: function () {},
            messageReceived: function () {}
        },
        connectionEvents = {
            OPEN: 'open',
            CLOSE: 'close'
        },
        cxSocketConnection = {},
        isConnected = true;

    function subscribeToChannel(channel, handler) {
        if (!channelHandlers[channel]) {
            channelHandlers[channel] = [];
        }
        channelHandlers[channel].push(handler);
    }

    function receiveMessageInChannel(channel, message, data) {
        var _handlers = channelHandlers[channel] || [],
            _handler,
            _payload = {
                channel: channel,
                type: message || '',
                data: data || {}
            };

        for (var ix = 0; ix < _handlers.length; ix++) {
            _handler = _handlers[ix];
            _handler([], _payload);
        }
    }

    function notifyConnectionIsOpened(session) {
        $rootScope.$broadcast(connectionEvents.OPEN, session);
    }

    function notifyConnectionIsClosed(reason) {
        $rootScope.$broadcast(connectionEvents.CLOSE, reason);
    }

    function Broker(channel, _publish) {
        this.messageReceivedHandler = function (p, payload) {
            handlers.messageReceived(payload.channel, payload.type, payload.data);
        };
        this.facade = {
            channel: channel,
            publish: _publish,
            subscribe: function () {}
        };
    }

    beforeEach(module('cxSocketSession'));

    beforeEach(function () {
        module(function ($provide) {
            $provide.constant('CX_SOCKET_CONNECTION_EVENTS', connectionEvents);
            $provide.value('cxSocketConnection', cxSocketConnection);
            $provide.value('CxSocketMessageBroker', Broker);
        });
    });

    beforeEach(inject(function (_$q_, _$timeout_, _$rootScope_) {
        $q = _$q_;
        $timeout = _$timeout_;
        $rootScope = _$rootScope_;

        channelHandlers = {};
        isConnected = true;
    }));

    beforeEach(function setSessionAndConnection() {
        autobahn.session2 = angular.copy(autobahn.session);

        cxSocketConnection.openConnection = function () {
            var defer = $q.defer();

            $timeout(function () {
                if (isConnected) {
                    defer.resolve(autobahn.session);
                    notifyConnectionIsOpened(autobahn.session);
                } else {
                    defer.reject();
                    notifyConnectionIsClosed();
                }
            });

            return defer.promise;
        };

        cxSocketConnection.closeConnection = function () {
            var defer = $q.defer();

            $timeout(function () {
                channelHandlers = {};
                defer.resolve();
                notifyConnectionIsClosed();
            });

            return defer.promise;
        };

        cxSocketConnection.closeAndRestablishConnection = function () {
            $timeout(function () {
                channelHandlers = {};
                notifyConnectionIsClosed();
                $timeout(function () {
                    notifyConnectionIsOpened(autobahn.session);
                });
            });
        };
    });

    beforeEach(function spyes() {
        spyOn(cxSocketConnection, 'openConnection').and.callThrough();
        spyOn(cxSocketConnection, 'closeConnection').and.callThrough();
        spyOn(autobahn.session, 'subscribe').and.callThrough();
        spyOn(autobahn.session, 'unsubscribe').and.callThrough();
        spyOn(autobahn.session, 'call').and.callThrough();
        spyOn(autobahn.session, 'publish').and.callThrough();
        spyOn(autobahn.session2, 'subscribe').and.callThrough();
        spyOn(autobahn.session2, 'unsubscribe').and.callThrough();
        spyOn(autobahn.session2, 'call').and.callThrough();
        spyOn(autobahn.session2, 'publish').and.callThrough();
        spyOn(handlers, 'success').and.callThrough();
        spyOn(handlers, 'error').and.callThrough();
        spyOn(handlers, 'messageReceived').and.callThrough();
    });

    describe('subscribe', function () {
        it('SHOULD be a function', inject(function (cxSocketSession) {
            expect(typeof cxSocketSession.subscribe).toBe('function');
        }));

        describe('WHEN subscribing', function () {

            describe('AND no channel is provided', function () {
                it('SHOULD throw an error', inject(function (cxSocketSession) {
                    function foo() {
                        cxSocketSession.subscribe();
                    }
                    expect(foo).toThrow();
                }));
            });

            describe('AND channel is provided', function () {
                it('SHOULD return a promise', inject(function (cxSocketSession) {
                    expect(typeof cxSocketSession.subscribe('foo').then).toBe('function');
                }));

                it('SHOULD invoke cxSocketConnection.openConnection', inject(function (cxSocketSession) {
                    cxSocketSession.subscribe('foo', null);
                    expect(cxSocketConnection.openConnection).toHaveBeenCalled();
                }));

                describe('AND the connection is established', function () {
                    it('SHOULD resolve the promise with a broker with the channel name asigned', inject(function (cxSocketSession) {
                        var _broker,
                            _channel = 'foo';
                        cxSocketSession.subscribe(_channel).then(function (broker) {
                            _broker = broker;
                        });
                        $timeout.flush();

                        expect(_broker.channel).toEqual(_channel);
                        expect(typeof _broker.subscribe).toBe('function');
                        expect(typeof _broker.publish).toBe('function');
                    }));
                });

                describe('AND the connection could NOT be established', function () {
                    it('SHOULD also return the broker', inject(function (cxSocketSession) {
                        var _broker,
                            _channel = 'foo';
                        cxSocketSession.subscribe(_channel).then(function (broker) {
                            _broker = broker;
                        });
                        isConnected = true;
                        $timeout.flush();

                        expect(_broker.channel).toEqual(_channel);
                        expect(typeof _broker.subscribe).toBe('function');
                        expect(typeof _broker.publish).toBe('function');
                    }));
                });

            });
        });

        describe('publish method given to broker to give an encapsulated way of publish messages through the session', function () {
            var _broker,
                _channel = 'foo';

            beforeEach(inject(function (cxSocketSession) {
                cxSocketSession.subscribe(_channel).then(function (broker) {
                    _broker = broker;
                });
                $timeout.flush();
                spyOn(_broker, 'publish').and.callThrough();

            }));

            it('should be a function ', inject(function (cxSocketSession) {
                expect(typeof _broker.publish).toBe('function');
            }));

            it('should return a promise', inject(function () {
                expect(typeof _broker.publish(_channel, 'bar').then).toBe('function');
            }));

            it('should call autobahn.session.call', inject(function () {
                _broker.publish(_channel, 'bar')
                    .then(handlers.success, handlers.error);
                $timeout.flush();

                expect(autobahn.session.publish).toHaveBeenCalled();
            }));

            describe('when there is connection', function () {
                it('should resolve the promise ', inject(function () {
                    _broker.publish(_channel, 'bar')
                        .then(handlers.success, handlers.error);
                    $timeout.flush();
                    expect(handlers.success).toHaveBeenCalled();
                }));
            });
            describe('when there is NO connection', function () {
                it('should reject the promise ', inject(function () {
                    cxSocketConnection.closeConnection();
                    $timeout.flush();
                    _broker.publish(_channel, 'bar')
                        .then(handlers.success, handlers.error);
                    $timeout.flush();
                    expect(handlers.error).toHaveBeenCalled();
                }));
            });
        });
        describe('ONCE subscribed', function () {
            describe('WHEN receiving a message', function () {
                it('SHOULD invoke the brokers MESSAGE handler assigned to the channel', inject(function (cxSocketSession) {
                    var _broker1,
                        _broker2,
                        _channel1 = 'foo',
                        _channel2 = 'bar';

                    cxSocketSession.subscribe(_channel1).then(function (broker) {
                        _broker1 = broker;
                    });

                    $timeout.flush();
                    cxSocketSession.subscribe(_channel2).then(function (broker) {
                        _broker2 = broker;
                    });

                    $timeout.flush();
                    receiveMessageInChannel(_channel1);
                    receiveMessageInChannel(_channel2);

                    expect(_broker1.channel).toBe(_channel1);
                    expect(_broker2.channel).toBe(_channel2);

                    expect(handlers.messageReceived.calls.argsFor(0)[0]).toBe(_channel1);
                    expect(handlers.messageReceived.calls.argsFor(1)[0]).toBe(_channel2);
                }));
            });

            describe('IF the connection is lost and regained again', function () {
                describe('WHEN receiving a message', function () {
                    it('SHOULD invoke the same brokers message handlers that was asigned at the beginning', inject(function (cxSocketSession) {
                        var _broker1,
                            _broker2,
                            _channel1 = 'foo',
                            _channel2 = 'bar';

                        cxSocketSession.subscribe(_channel1).then(function (broker) {
                            _broker1 = broker;
                        });
                        $timeout.flush();

                        cxSocketSession.subscribe(_channel2).then(function (broker) {
                            _broker2 = broker;
                        });
                        $timeout.flush();

                        receiveMessageInChannel(_channel1);
                        receiveMessageInChannel(_channel2);
                        expect(_broker1.channel).toBe(_channel1);
                        expect(_broker2.channel).toBe(_channel2);
                        expect(handlers.messageReceived.calls.argsFor(0)[0]).toBe(_channel1);
                        expect(handlers.messageReceived.calls.argsFor(1)[0]).toBe(_channel2);

                        cxSocketConnection.closeAndRestablishConnection();
                        $timeout.flush();

                        receiveMessageInChannel(_channel1);
                        receiveMessageInChannel(_channel2);
                        expect(handlers.messageReceived.calls.argsFor(2)[0]).toBe(_channel1);
                        expect(handlers.messageReceived.calls.argsFor(3)[0]).toBe(_channel2);
                    }));
                });

                describe('WHEN subscribing while theres no connection', function () {
                    it('SHOULD store the handlers and subscribe them when reconnecting', inject(function (cxSocketSession) {
                        var _broker1,
                            _broker2,
                            _channel1 = 'foo',
                            _channel2 = 'bar';

                        cxSocketSession.subscribe(_channel1).then(function (broker) {
                            _broker1 = broker;
                        });
                        $timeout.flush();

                        receiveMessageInChannel(_channel1);
                        expect(_broker1.channel).toBe(_channel1);
                        expect(handlers.messageReceived.calls.argsFor(0)[0]).toBe(_channel1);

                        cxSocketConnection.closeConnection();
                        isConnected = false;

                        cxSocketSession.subscribe(_channel2).then(function (broker) {
                            _broker2 = broker;
                        });
                        $timeout.flush();

                        isConnected = true;
                        cxSocketConnection.openConnection();
                        $timeout.flush();

                        receiveMessageInChannel(_channel2);
                        expect(_broker2.channel).toBe(_channel2);
                        expect(handlers.messageReceived.calls.argsFor(1)[0]).toBe(_channel2);
                    }));
                });
            });
        });
    });

    describe('remoteCall', function () {
        it('SHOULD be a function', inject(function (cxSocketSession) {
            expect(typeof cxSocketSession.remoteCall).toBe('function');
        }));

        it('SHOULD return a promise', inject(function (cxSocketSession) {
            expect(typeof cxSocketSession.remoteCall().then).toBe('function');
        }));

        describe('WHEN the connection has been established', function () {

            it('SHOULD invoke autobahn session call with a method name and a payload', inject(function (cxSocketSession) {
                var methodName = 'foo',
                    payload = {
                        bar: 'baz'
                    };
                cxSocketSession.remoteCall(methodName, payload);
                $timeout.flush();

                expect(autobahn.session.call).toHaveBeenCalledWith(methodName, [], payload);
            }));

            it('SHOULD NOT invoke CxSocketConnection.open() ', inject(function (cxSocketSession) {
                cxSocketConnection.openConnection();
                $timeout.flush();

                cxSocketSession.remoteCall('foo', {
                    bar: 'baz'
                });
                expect(cxSocketConnection.openConnection.calls.count()).toBe(1);
            }));

        });

        describe('WHEN the connection has NOT been established', function () {
            it('SHOULD invoke CxSocketConnection.open() ', inject(function (cxSocketSession) {
                cxSocketSession.remoteCall('foo', {
                    bar: 'baz'
                });
                expect(cxSocketConnection.openConnection.calls.count()).toBe(1);
            }));
        });
    });

    describe('destroy', function () {
        it('should be a function', inject(function (cxSocketSession) {
            expect(typeof cxSocketSession.destroy).toBe('function');
        }));

        describe('promise', function () {
            it('should return a promise', inject(function (cxSocketSession) {
                var promise = cxSocketSession.destroy();
                expect(typeof promise.then).toBe('function');
            }));

            it('should resolve when cxSocketConnection is closed', inject(function (cxSocketSession) {
                cxSocketConnection.openConnection();
                $timeout.flush();

                cxSocketSession.destroy().then(handlers.success);
                $timeout.flush();

                expect(handlers.success).toHaveBeenCalled();
            }));
        });

        it('should clean all handlers so that it is clean when subscribing to a new session', inject(function (cxSocketSession) {
            [>var _broker1,
                _broker2,
                _channel1 = 'foo',
                _channel2 = 'bar';

            cxSocketSession.subscribe(_channel1).then(function (broker) {
                _broker1 = broker;
            });
            $timeout.flush();

            cxSocketSession.subscribe(_channel2).then(function (broker) {
                _broker2 = broker;
            });
            $timeout.flush();

            receiveMessageInChannel(_channel1);
            receiveMessageInChannel(_channel2);
            expect(_broker1.channel).toBe(_channel1);
            expect(_broker2.channel).toBe(_channel2);
            expect(handlers.messageReceived.calls.argsFor(0)[0]).toBe(_channel1);
            expect(handlers.messageReceived.calls.argsFor(1)[0]).toBe(_channel2);

            cxSocketSession.destroy();

            cxSocketConnection.openConnection();

            $timeout.flush();

            receiveMessageInChannel(_channel1);
            receiveMessageInChannel(_channel2);

            console.log('_broker1',_broker1);

            spyOn(_broker1,'messageReceivedHandler');
            spyOn(_broker2,'messageReceivedHandler');

            expect(handlers.messageReceived).toHaveBeenCalled();
            expect(_broker1.messageReceivedHandler).not.toHaveBeenCalled();
            expect(_broker2.messageReceivedHandler).not.toHaveBeenCalled();<]
        }));

        it('should unsubscribe all autobahn subscriptions from autobahn session', inject(function (cxSocketSession) {
            var _broker1,
                _channel1 = 'foo';

            cxSocketSession.subscribe(_channel1).then(function (broker) {
                _broker1 = broker;
            });
            $timeout.flush();

            cxSocketSession.destroy();
            $timeout.flush();

            expect(autobahn.session.unsubscribe).toHaveBeenCalled();
        }));

        it('should invoke cxSocketConnection.close', inject(function (cxSocketSession) {
            cxSocketSession.subscribe('foo');
            cxSocketSession.destroy();
            $timeout.flush();
            expect(cxSocketConnection.closeConnection).toHaveBeenCalled();
        }));

        it('should invoke destroy on all brokers', inject(function (cxSocketSession) {

        }));

    });*/
});
