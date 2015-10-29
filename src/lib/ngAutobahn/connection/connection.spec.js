describe('cxSocketConnection', function () {
    'use strict';

    var autobahn,
        promiseHandlers;

    beforeEach(module('cxSocketConnection'));

    beforeEach(function () {
        promiseHandlers = {
            success: function () {},
            error: function () {},
            notify: function () {},
            call: function () {}
        };
        spyOn(promiseHandlers, 'success').and.callThrough();
        spyOn(promiseHandlers, 'error').and.callThrough();
        spyOn(promiseHandlers, 'notify').and.callThrough();
        spyOn(promiseHandlers, 'call').and.callThrough();

    });

    describe('service', function () {
        var $q,
            $rootScope,
            socketConnection,
            $timeout,
            $interval,
            CX_SOCKET_CONNECTION_EVENTS;

        beforeEach(inject(function (_$q_, _$rootScope_, cxSocketConnection, _$interval_, _$timeout_, _CX_SOCKET_CONNECTION_EVENTS_) {
            $q = _$q_;
            $rootScope = _$rootScope_;
            socketConnection = cxSocketConnection;
            $interval = _$interval_;
            $timeout = _$timeout_;
            CX_SOCKET_CONNECTION_EVENTS = _CX_SOCKET_CONNECTION_EVENTS_;
        }));

        beforeEach(function () {
            autobahn = (function () {
                var self = this,
                    _isConnected = true,
                    _restablishAfterClose = false;

                // -- CONNECTION -------------------------------
                function Connection() {}

                Connection.prototype.close = function () {
                    var self = this;
                    $timeout(function () {
                        if (_restablishAfterClose) {
                            _isConnected = true;
                        }
                        self.onclose();
                    });
                };

                Connection.prototype.open = function () {
                    var self = this;

                    $timeout(function () {
                        if (isConnected()) {
                            self.onopen(new Session());
                        } else {
                            self.onclose();
                        }
                    });
                };

                // -- SESSION ---------------------------------
                function Session() {}

                Session.prototype.call = function (message) {
                    var defer = $q.defer();
                    $timeout(function () {
                        if (isConnected()) {
                            defer.resolve();
                        } else {
                            $timeout.flush();
                        }
                    });
                    return defer.promise;
                };

                // -- SESSION ---------------------------------
                return {
                    Connection: Connection,
                    Session: Session,
                    dropConnection: dropConnection,
                    restablishConnection: restablishConnection,
                    isConnected: isConnected
                };

                function isConnected() {
                    return _isConnected;
                }

                function dropConnection(once) {
                    if (once) {
                        _restablishAfterClose = true;
                    }
                    _isConnected = false;
                }

                function restablishConnection() {
                    _isConnected = true;
                }

            }());
        });

        beforeEach(function () {
            window.autobahn = autobahn;
            spyOn(autobahn.Connection.prototype, 'open').and.callThrough();
            spyOn(autobahn.Connection.prototype, 'close').and.callThrough();
            spyOn(autobahn.Session.prototype, 'call').and.callThrough();
        });

        describe('openConnection METHOD', function () {
            it('should exist', function () {
                expect(typeof socketConnection.openConnection).toBe('function');
            });

            it('should return a promise', function () {
                var promise = socketConnection.openConnection();
                expect(typeof promise.then).toBe('function');
            });

            it('should invoke autobahn.open', function () {
                socketConnection.openConnection();
                expect(autobahn.Connection.prototype.open).toHaveBeenCalled();
            });

            it('should broadcast an open event when the connection is established', function () {
                var foo = {
                    bar: function () {}
                };
                spyOn(foo, 'bar');

                $rootScope.$on(CX_SOCKET_CONNECTION_EVENTS.OPEN, foo.bar);
                socketConnection.openConnection();
                $timeout.flush();
                expect(foo.bar).toHaveBeenCalled();
            });

            describe('establishing connection', function () {

                it('should resolve the promise when the connection is stablished', function () {
                    socketConnection.openConnection().then(promiseHandlers.success);
                    $timeout.flush();
                    expect(promiseHandlers.success).toHaveBeenCalled();
                });

                it('should reject the promise when the connection can NOT be stablished', function () {
                    socketConnection.openConnection().then(promiseHandlers.success, promiseHandlers.error);
                    autobahn.dropConnection();
                    $timeout.flush();
                    expect(promiseHandlers.error).toHaveBeenCalled();
                });

                it('should resolve the same instance of _session when calling openConnection twice', function () {
                    var session1, session2;

                    socketConnection.openConnection().then(function (session) {
                        session1 = session;
                    });
                    $timeout.flush();

                    socketConnection.openConnection().then(function (session) {
                        session2 = session;
                    });
                    $timeout.flush();

                    expect(session1).toBe(session2);
                });

                it('should resolve with a new instance of session when calling openConnection , then close and open again', function () {
                    var session1, session2;

                    socketConnection.openConnection().then(function (session) {
                        session1 = session;
                    });
                    $timeout.flush();

                    socketConnection.closeConnection();
                    $timeout.flush();

                    socketConnection.openConnection().then(function (session) {
                        session2 = session;
                    });
                    $timeout.flush();

                    expect(session1).not.toBe(session2);
                });

            });
        });

        describe('integration test', function () {
            /*describe('ping', function () {
                it('should be invoked as soon as the connection is established', function () {
                    var spy = autobahn.Session.prototype.call;

                    socketConnection.openConnection();
                    $timeout.flush();

                    expect(spy).toHaveBeenCalledWith('ping');
                });

                it('should be invoked 4 times using the default configuration', function () {
                    var spy = autobahn.Session.prototype.call;

                    socketConnection.openConnection();
                    $timeout.flush();
                    $interval.flush(5000); // 1 (ping 1st call) + (3 * 1.5s = 4.5s) -> 5s ~ 4 calls

                    expect(spy.calls.count()).toEqual(4);
                });

                describe('WHEN exceeding the configured ping.timeout (3s)', function () {
                    it('should close the connection', inject(function () {
                        var spy = autobahn.Connection.prototype.close;

                        socketConnection.openConnection();
                        $timeout.flush();
                        $interval.flush(5000); // 1 (ping 1st call) + (3 * 1.5s = 4.5s) -> 5s ~ 4 calls
                        autobahn.dropConnection();
                        $interval.flush(5000); // 1 (ping 1st call) + (3 * 1.5s = 4.5s) -> 5s ~ 4 calls

                        expect(spy).toHaveBeenCalled();
                    }));

                    it('should open the connection after closing it', inject(function () {
                        var spy = autobahn.Connection.prototype.open;

                        socketConnection.openConnection();
                        $timeout.flush();
                        $interval.flush(5000); // 1 (ping 1st call) + (3 * 1.5s = 4.5s) -> 5s ~ 4 calls
                        autobahn.dropConnection(true);
                        $interval.flush(5000); // 1 (ping 1st call) + (3 * 1.5s = 4.5s) -> 5s ~ 4 calls

                        expect(spy.calls.count()).toEqual(2);
                    }));
                });

                it('should stop after closing the connection on purpose', inject(function () {
                    var spy = autobahn.Session.prototype.call;

                    socketConnection.openConnection();
                    $timeout.flush();
                    $interval.flush(5000); // 1 (ping 1st call) + (3 * 1.5s = 4.5s) -> 5s ~ 4 calls
                    socketConnection.closeConnection();
                    $interval.flush(5000); // 1 (ping 1st call) + (3 * 1.5s = 4.5s) -> 5s ~ 4 calls

                    expect(spy.calls.count()).toEqual(4);
                }));
            });*/
        });

        describe('closeConnection METHOD', function () {
            it('should exist', function () {
                expect(typeof socketConnection.closeConnection).toBe('function');
            });

            it('should return a promise', function () {
                var promise = socketConnection.closeConnection();
                expect(typeof promise.then).toBe('function');
            });

            it('should broadcast a close event when the connection is closed', function () {
                var foo = {
                    bar: function () {}
                };
                spyOn(foo, 'bar');

                $rootScope.$on(CX_SOCKET_CONNECTION_EVENTS.CLOSE, foo.bar);
                socketConnection.openConnection();
                $timeout.flush();
                socketConnection.closeConnection();
                $timeout.flush();
                expect(foo.bar).toHaveBeenCalled();
            });

            describe('connected', function () {
                it('should invoke autobahn.close', function () {
                    socketConnection.openConnection().then(socketConnection.closeConnection());
                    $timeout.flush();
                    expect(autobahn.Connection.prototype.close).toHaveBeenCalled();
                });
            });
        });
    });
});
