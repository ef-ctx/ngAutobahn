describe('ngAutobahnSession', function () {
    'use strict';

    var $q,
        $timeout,
        $rootScope,
        channelHandlers = {},
        autobahn = {
            session: {
                subscribe: function (channel, fn) {
                    var defer = $q.defer();
                    subscribeToChannel(channel, fn);
                    defer.resolve(new Subscription(channel));
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
        ngAutobahnConnection = {},
        isConnected = true,
        subscriptions = 0,
        _subscription_1 = {
            broker: undefined,
            channel: 'channel1',
            message: {
                name: 'messageForChannel1',
                data: {
                    foo: 'bar'
                }
            }
        },
        _subscription_2 = {
            broker: undefined,
            channel: 'channel2',
            message: {
                name: 'messageForChannel2',
                data: {
                    bar: 'baz'
                }
            }
        };

    function Subscription(channel) {
        this.id = subscriptions++;
        this.channel = channel;
    }

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

    beforeEach(module('ngAutobahn.session'));

    beforeEach(function () {
        module(function ($provide) {
            $provide.constant('NG_AUTOBAHN_CONNECTION_EVENTS', connectionEvents);
            $provide.value('ngAutobahnConnection', ngAutobahnConnection);
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

        ngAutobahnConnection.openConnection = function () {
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

        ngAutobahnConnection.closeConnection = function () {
            var defer = $q.defer();

            $timeout(function () {
                channelHandlers = {};
                notifyConnectionIsClosed();
                defer.resolve();
            });

            return defer.promise;
        };

        ngAutobahnConnection.closeAndRestablishConnection = function () {
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
        spyOn(ngAutobahnConnection, 'openConnection').and.callThrough();
        spyOn(ngAutobahnConnection, 'closeConnection').and.callThrough();
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

    afterEach(function () {
        subscriptions = 1;
    });

    describe('subscribe', function () {
        it('SHOULD be a function', inject(function (ngAutobahnSession) {
            expect(typeof ngAutobahnSession.subscribe).toBe('function');
        }));

        describe('WHEN subscribing', function () {
            describe('AND no channel is provided', function () {
                it('SHOULD throw an error', inject(function (ngAutobahnSession) {
                    function foo() {
                        ngAutobahnSession.subscribe();
                    }
                    expect(foo).toThrow();
                }));
            });

            describe('AND channel is provided', function () {
                it('SHOULD return a promise', inject(function (ngAutobahnSession) {
                    expect(typeof ngAutobahnSession.subscribe('foo').then).toBe('function');
                }));

                it('SHOULD invoke ngAutobahnConnection.openConnection', inject(function (ngAutobahnSession) {
                    ngAutobahnSession.subscribe('foo', null);
                    expect(ngAutobahnConnection.openConnection).toHaveBeenCalled();
                }));

                describe('AND the connection is established', function () {
                    it('SHOULD resolve the promise with a broker with the channel name asigned', inject(function (ngAutobahnSession) {
                        var _broker,
                            _channel = 'foo';
                        ngAutobahnSession.subscribe(_channel).then(function (broker) {
                            _broker = broker;
                        });
                        $timeout.flush();

                        expect(_broker.getChannel()).toEqual(_channel);
                        expect(typeof _broker.subscribe).toBe('function');
                        expect(typeof _broker.publish).toBe('function');
                    }));
                });

                describe('AND the connection could NOT be established', function () {
                    it('SHOULD also return the broker', inject(function (ngAutobahnSession) {
                        var _broker,
                            _channel = 'foo';
                        ngAutobahnSession.subscribe(_channel).then(function (broker) {
                            _broker = broker;
                        });
                        isConnected = true;
                        $timeout.flush();

                        expect(_broker.getChannel()).toEqual(_channel);
                        expect(typeof _broker.subscribe).toBe('function');
                        expect(typeof _broker.publish).toBe('function');
                    }));
                });

            });
        });

        describe('publish method given to broker to give an encapsulated way of publish messages through the session', function () {
            var _broker,
                _channel = 'foo';

            beforeEach(inject(function (ngAutobahnSession) {
                ngAutobahnSession.subscribe(_channel).then(function (broker) {
                    _broker = broker;
                });
                $timeout.flush();
                spyOn(_broker, 'publish').and.callThrough();

            }));

            it('should be a function ', inject(function (ngAutobahnSession) {
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
                it('should reject the promise ', inject(function (ngAutobahnSession) {
                    ngAutobahnConnection.closeConnection();
                    $timeout.flush();

                    _broker.publish(_channel, 'bar')
                        .then(handlers.success, handlers.error);
                    $timeout.flush();
                    expect(handlers.error).toHaveBeenCalled();
                }));
            });

        });

        describe('ONCE subscribed', function () {

            beforeEach(inject(function (ngAutobahnSession) {
                ngAutobahnSession.subscribe(_subscription_1.channel).then(function (broker) {
                    _subscription_1.broker = broker;
                    _subscription_1.broker.subscribe(_subscription_1.message.name, handlers.messageReceived);
                });
                $timeout.flush();

                ngAutobahnSession.subscribe(_subscription_2.channel).then(function (broker) {
                    _subscription_2.broker = broker;
                    _subscription_2.broker.subscribe(_subscription_2.message.name, handlers.messageReceived);
                });
                $timeout.flush();

                receiveMessageInChannel(_subscription_1.channel, _subscription_1.message.name, _subscription_1.message.data);
                receiveMessageInChannel(_subscription_2.channel, _subscription_2.message.name, _subscription_2.message.data);
            }));

            describe('WHEN receiving a message', function () {
                it('SHOULD invoke the brokers MESSAGE handler assigned to the channel', function () {
                    expect(handlers.messageReceived.calls.argsFor(0)[0]).toBe(_subscription_1.message.data);
                    expect(handlers.messageReceived.calls.argsFor(1)[0]).toBe(_subscription_2.message.data);
                });
            });

            describe('IF the connection is lost and regained again', function () {
                describe('WHEN receiving a message', function () {
                    it('SHOULD invoke the same brokers message handlers that was asigned at the beginning', function () {
                        ngAutobahnConnection.closeAndRestablishConnection();
                        $timeout.flush();

                        receiveMessageInChannel(_subscription_1.channel, _subscription_1.message.name, _subscription_1.message.data);
                        receiveMessageInChannel(_subscription_2.channel, _subscription_2.message.name, _subscription_2.message.data);

                        expect(handlers.messageReceived.calls.argsFor(2)[0]).toBe(_subscription_1.message.data);
                        expect(handlers.messageReceived.calls.argsFor(3)[0]).toBe(_subscription_2.message.data);
                    });
                });
            });
        });

        describe('WHEN subscribing while theres no connection', function () {
            it('SHOULD store the handlers and subscribe them when reconnecting', inject(function (ngAutobahnSession) {
                ngAutobahnSession.subscribe(_subscription_1.channel).then(function (broker) {
                    _subscription_1.broker = broker;
                    _subscription_1.broker.subscribe(_subscription_1.message.name, handlers.messageReceived);
                });
                $timeout.flush();

                receiveMessageInChannel(_subscription_1.channel, _subscription_1.message.name, _subscription_1.message.data);
                expect(handlers.messageReceived.calls.argsFor(0)[0]).toBe(_subscription_1.message.data);

                ngAutobahnConnection.closeConnection();
                isConnected = false;

                ngAutobahnSession.subscribe(_subscription_2.channel).then(function (broker) {
                    _subscription_2.broker = broker;
                    _subscription_2.broker.subscribe(_subscription_2.message.name, handlers.messageReceived);
                });
                $timeout.flush();

                isConnected = true;
                ngAutobahnConnection.openConnection();
                $timeout.flush();

                receiveMessageInChannel(_subscription_2.channel, _subscription_2.message.name, _subscription_2.message.data);
                expect(handlers.messageReceived.calls.argsFor(1)[0]).toBe(_subscription_2.message.data);
            }));
        });
    });

    describe('unsubscribeBroker', function () {
        var _session,
            _broker,
            _channel = 'foo';

        beforeEach(inject(function (ngAutobahnSession) {
            _session = ngAutobahnSession;
            _session.subscribe(_channel).then(function (broker) {
                _broker = broker;
            });
            $timeout.flush();
        }));

        it('SHOULD be a function', function () {
            expect(typeof _session.unsubscribeBroker).toBe('function');
        });

        describe('IF a broker is provided', function () {
            it('SHOULD invoke autobahn.session.unsubscribe with the broker´s subscription', function () {
                _session.unsubscribeBroker(_broker);
                expect(autobahn.session.unsubscribe.calls.argsFor(0)[0].id).toBe(1);
            });
        });

        describe('if a broker is not provided', function () {
            it('should throw an error', function () {
                expect(callUnsubscribeBroker).toThrow();

                function callUnsubscribeBroker() {
                    _session.unsubscribeBroker();
                }
            });
        });

    });

    describe('remoteCall', function () {
        it('SHOULD be a function', inject(function (ngAutobahnSession) {
            expect(typeof ngAutobahnSession.remoteCall).toBe('function');
        }));

        it('SHOULD return a promise', inject(function (ngAutobahnSession) {
            expect(typeof ngAutobahnSession.remoteCall().then).toBe('function');
        }));

        describe('WHEN the connection has been established', function () {

            it('SHOULD invoke autobahn session call with a method name and a payload', inject(function (ngAutobahnSession) {
                var methodName = 'foo',
                    payload = {
                        bar: 'baz'
                    };
                ngAutobahnSession.remoteCall(methodName, payload);
                $timeout.flush();

                expect(autobahn.session.call).toHaveBeenCalledWith(methodName, [], payload);
            }));

            it('SHOULD NOT invoke CxSocketConnection.open() ', inject(function (ngAutobahnSession) {
                ngAutobahnConnection.openConnection();
                $timeout.flush();

                ngAutobahnSession.remoteCall('foo', {
                    bar: 'baz'
                });
                expect(ngAutobahnConnection.openConnection.calls.count()).toBe(1);
            }));

        });

        describe('WHEN the connection has NOT been established', function () {
            it('SHOULD invoke CxSocketConnection.open() ', inject(function (ngAutobahnSession) {
                ngAutobahnSession.remoteCall('foo', {
                    bar: 'baz'
                });
                expect(ngAutobahnConnection.openConnection.calls.count()).toBe(1);
            }));
        });
    });

    describe('end', function () {
        it('should be a function', inject(function (ngAutobahnSession) {
            expect(typeof ngAutobahnSession.end).toBe('function');
        }));

        describe('promise', function () {
            it('should return a promise', inject(function (ngAutobahnSession) {
                var promise = ngAutobahnSession.end();
                expect(typeof promise.then).toBe('function');
            }));

            it('should resolve when ngAutobahnConnection is closed', inject(function (ngAutobahnSession) {
                ngAutobahnConnection.openConnection();
                $timeout.flush();

                ngAutobahnSession.end().then(handlers.success);
                $timeout.flush();

                expect(handlers.success).toHaveBeenCalled();
            }));
        });

        it('should clean all handlers so that it is clean when subscribing to a new session', inject(function (ngAutobahnSession) {
            ngAutobahnSession.subscribe(_subscription_1.channel).then(function (broker) {
                _subscription_1.broker = broker;
                _subscription_1.broker.subscribe(_subscription_1.message.name, handlers.messageReceived);
            });
            $timeout.flush();

            ngAutobahnSession.subscribe(_subscription_2.channel).then(function (broker) {
                _subscription_2.broker = broker;
                _subscription_2.broker.subscribe(_subscription_2.message.name, handlers.messageReceived);
            });
            $timeout.flush();

            receiveMessageInChannel(_subscription_1.channel, _subscription_1.message.name, _subscription_1.message.data);
            receiveMessageInChannel(_subscription_2.channel, _subscription_2.message.name, _subscription_2.message.data);
            expect(handlers.messageReceived.calls.argsFor(0)[0]).toBe(_subscription_1.message.data);
            expect(handlers.messageReceived.calls.argsFor(1)[0]).toBe(_subscription_2.message.data);

            ngAutobahnSession.end();

            ngAutobahnConnection.openConnection();

            $timeout.flush();

            receiveMessageInChannel(_subscription_1.channel, _subscription_1.message.name, _subscription_1.message.data);
            receiveMessageInChannel(_subscription_2.channel, _subscription_2.message.name, _subscription_2.message.data);

            expect(handlers.messageReceived.calls.count()).toBe(2);

        }));

        it('should unsubscribe all autobahn subscriptions from autobahn session', inject(function (ngAutobahnSession) {
            ngAutobahnSession.subscribe(_subscription_1.channel);
            $timeout.flush();

            ngAutobahnSession.end();
            $timeout.flush();

            expect(autobahn.session.unsubscribe).toHaveBeenCalled();
        }));

        it('should invoke ngAutobahnConnection.close', inject(function (ngAutobahnSession) {
            ngAutobahnSession.subscribe('foo');
            ngAutobahnSession.end();
            $timeout.flush();
            expect(ngAutobahnConnection.closeConnection).toHaveBeenCalled();
        }));

    });
});
