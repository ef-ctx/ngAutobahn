describe('ngAutobahn.connection', function () {
    'use strict';

    var autobahn,
        promiseHandlers;

    beforeEach(module('ngAutobahn.connection'));

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
            NG_AUTOBAHN_CONNECTION_EVENTS;

        beforeEach(inject(function (_$q_, _$rootScope_, _ngAutobahnConnection_, _$interval_, _$timeout_, _NG_AUTOBAHN_CONNECTION_EVENTS_) {
            $q = _$q_;
            $rootScope = _$rootScope_;
            socketConnection = _ngAutobahnConnection_;
            $interval = _$interval_;
            $timeout = _$timeout_;
            NG_AUTOBAHN_CONNECTION_EVENTS = _NG_AUTOBAHN_CONNECTION_EVENTS_;
        }));

        beforeEach(function () {
            autobahn = (function () {
                var self = this,
                    _isConnected = true,
                    _restablishAfterClose = false,
                    _currentConnection;

                // -- CONNECTION -------------------------------
                function Connection() {
                    var self = this;

                    _currentConnection = this;

                    self._ext_onclose = function () {};

                    Object.defineProperty(this, 'onclose', {
                        get: function () {
                            return self._onclose;
                        },
                        set: function (value) {
                            self._ext_onclose = value;
                        }
                    });
                }

                Connection.prototype.close = function () {
                    var self = this;
                    $timeout(function () {
                        if (_restablishAfterClose) {
                            _isConnected = true;
                        }

                        self.onclose();
                    });
                };

                Connection.prototype._onclose = function () {
                    if (this._ext_onclose) {
                        this._ext_onclose('lost');
                    }
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

                    _currentConnection.close();
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
            spyOn(autobahn.Connection.prototype, '_onclose').and.callThrough();
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

                $rootScope.$on(NG_AUTOBAHN_CONNECTION_EVENTS.OPEN, foo.bar);
                socketConnection.openConnection();
                $timeout.flush();
                expect(foo.bar).toHaveBeenCalled();
            });

            describe('establishing connection', function () {

                it('should resolve the promise when the connection is established', function () {
                    socketConnection.openConnection().then(promiseHandlers.success);
                    $timeout.flush();
                    expect(promiseHandlers.success).toHaveBeenCalled();
                });

                it('should notify about connection lost after a connection is established and is then lost', function () {
                    var foo = {
                        bar: function () {}
                    };
                    spyOn(foo, 'bar');

                    $rootScope.$on(NG_AUTOBAHN_CONNECTION_EVENTS.LOST, foo.bar);

                    socketConnection.openConnection().then(promiseHandlers.success);
                    $timeout.flush();

                    expect(promiseHandlers.success).toHaveBeenCalled();

                    autobahn.dropConnection();
                    $timeout.flush();

                    expect(autobahn.Connection.prototype._onclose).toHaveBeenCalled();
                    expect(foo.bar).toHaveBeenCalled();
                });

                it('should reject the promise when the connection can NOT be stablished', function () {
                    socketConnection.openConnection().then(promiseHandlers.success, promiseHandlers.error);
                    autobahn.dropConnection();
                    $timeout.flush();

                    expect(promiseHandlers.error).toHaveBeenCalled();
                    expect(autobahn.Connection.prototype._onclose).toHaveBeenCalled();
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

                $rootScope.$on(NG_AUTOBAHN_CONNECTION_EVENTS.CLOSE, foo.bar);
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
