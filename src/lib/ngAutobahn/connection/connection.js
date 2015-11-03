/*globals autobahn:true*/
(function (angular) {
    'use strict';

    /*****************************************************************************
     *
     * @ngdoc module
     * @name ngAutobahn.connection
     * @module ngAutobahn.connection
     * @description module for socket connection matters
     *
     *****************************************************************************/
    angular.module('ngAutobahn.connection', [
        'ngAutobahn.utils.ping'
    ])

    /**********************************************************
     *
     * @ngdoc constant
     * @name NG_AUTOBAHN_CONNECTION_STATUS
     * @module ngAutobahn.connection
     * @description exposed connection states
     *
     **********************************************************/

    .constant('NG_AUTOBAHN_CONNECTION_STATUS', {
        OPENED: 'ngAutobahn.connection.state.opened',
        CLOSED: 'ngAutobahn.connection.state.closed',
        LOST: 'ngAutobahn.connection.state.lost'
    })

    /*****************************************************************************
     *
     * @ngdoc constant
     * @name NG_AUTOBAHN_CONNECTION_EVENTS
     * @module ngAutobahn.connection
     *
     *****************************************************************************/

    .constant('NG_AUTOBAHN_CONNECTION_EVENTS', {
        OPEN: 'ngAutobahn.connection.open',
        CLOSE: 'ngAutobahn.connection.close',
        LOST: 'ngAutobahn.connection.lost'
    })

    /*****************************************************************************
     *
     * @ngdoc provider
     * @name ngAutobahnConnection
     * @module ngAutobahn.connection
     *
     * @description
     * provides a way to manage socket connection.
     *
     *****************************************************************************/

    .provider('ngAutobahnConnection', [
        'PingProvider',
        function ngAutobahnConnectionProvider(PingProvider) {
            /**
             * @type {Object} provider configuration used in service/factory below
             */
            var autobahnOptions = {},
                serviceConfig = {
                    mockMode: false,
                    url: null,
                    realm: null,
                    retries: {
                        max: 100, // integer - Maximum number of reconnection attempts (default: 15)
                        initialDelay: 3, // float - Initial delay for reconnection attempt in seconds (default: 1.5).
                        delayGrowthFactor: 1.5, // float - The growth factor applied to the retry delay between reconnection attempts (default: 1.5).
                        maxDelay: 300, // float - Maximum delay for reconnection attempts in seconds (default: 300).
                        delayJitter: 0.1 // float - The standard deviation of a Gaussian to jitter the delay on each retry cycle as a fraction of the mean (default: 0.1).
                    },
                    ping: {
                        delay: 5000,
                        timeout: 10000
                    }
                };

            /**
             * @ngdoc method
             * @name commsProvider#configure
             *
             * @description
             * Configures {@link comms}.
             *
             * @param {Object} config Object with configuration options, extends base configuration.
             *
             * - url: the comms websocket location
             * - realm: the comms realm
             */
            this.configure = function (config) {
                angular.extend(serviceConfig, config);

                autobahnOptions = {
                    url: serviceConfig.url,
                    realm: serviceConfig.realm,
                    max_retries: serviceConfig.retries.max,
                    initial_retry_delay: serviceConfig.retries.initialDelay,
                    retry_delay_growth: serviceConfig.retries.delayGrowthFactor,
                    max_retry_delay: serviceConfig.retries.maxDelay,
                    retry_delay_jitter: serviceConfig.retries.delayJitter
                };

                PingProvider.configure({
                    delay: serviceConfig.ping.delay,
                    maxResponseDelay: serviceConfig.ping.timeout
                });
            };

            this.$get = [
                '$q',
                '$rootScope',
                'Ping',
                'NG_AUTOBAHN_CONNECTION_STATUS',
                'NG_AUTOBAHN_CONNECTION_EVENTS',
                function (
                    $q,
                    $rootScope,
                    Ping,
                    NG_AUTOBAHN_CONNECTION_STATUS,
                    NG_AUTOBAHN_CONNECTION_EVENTS
                ) {

                    return new CxSocketConnection();

                    function CxSocketConnection() {
                        var self = this,
                            _session,
                            _connection,
                            _status = NG_AUTOBAHN_CONNECTION_STATUS.CLOSED,
                            _ping = new Ping(pingFn, reconnect);

                        self.openConnection = openConnection;
                        self.closeConnection = closeConnection;

                        Object.defineProperty(self, 'status', {
                            get: function statusGetter() {
                                return _status;
                            }
                        });

                        Object.defineProperty(self, 'isOpen', {
                            get: function () {
                                return _status === NG_AUTOBAHN_CONNECTION_STATUS.OPENED;
                            }
                        });

                        Object.defineProperty(self, 'isClosed', {
                            get: function () {
                                return _status === NG_AUTOBAHN_CONNECTION_STATUS.CLOSED;
                            }
                        });

                        Object.defineProperty(self, 'isLost', {
                            get: function () {
                                return _status === NG_AUTOBAHN_CONNECTION_STATUS.LOST;
                            }
                        });

                        /****************************************************************
                         * OPEN
                         ***************************************************************/

                        function openConnection() {
                            var defer = $q.defer();

                            if (_connection) {
                                defer.resolve(_session);
                                _connectionOpenedHandler();
                            } else {
                                _connection = new autobahn.Connection(autobahnOptions);

                                _connection.onopen = function (session) {
                                    _session = session;
                                    _ping.start();
                                    defer.resolve(session);
                                    _connectionOpenedHandler();
                                };

                                _connection.onclose = function (reason) {
                                    defer.reject();
                                    _connectionLostHandler();
                                };

                                _connection.open();
                            }

                            return defer.promise;
                        }

                        /****************************************************************
                         * CLOSE
                         ***************************************************************/

                        function closeConnection() {
                            return _closeConnection()
                                .then(_connectionClosedHandler);
                        }

                        function _closeConnection() {
                            var defer = $q.defer();

                            if (_connection) {
                                _ping.stop();
                                _connection.onclose = function (reason) {
                                    _connection = null;
                                    defer.resolve();
                                };
                                _connection.close();
                            } else {
                                defer.reject();
                            }

                            return defer.promise;
                        }

                        /****************************************************************
                         * HELPERS
                         ***************************************************************/

                        function reconnect() {
                            _connectionLostHandler();

                            _closeConnection()
                                .then(openConnection);
                        }

                        function pingFn() {
                            return _session.call('ping');
                        }

                        /****************************************************************
                         * HANDLERS
                         ***************************************************************/

                        function _connectionLostHandler() {
                            _status = NG_AUTOBAHN_CONNECTION_STATUS.LOST;
                            notifyConnectionIsLost();
                        }

                        function _connectionClosedHandler() {
                            _status = NG_AUTOBAHN_CONNECTION_STATUS.CLOSED;
                            notifyConnectionIsClosed();
                        }

                        function _connectionOpenedHandler() {
                            _status = NG_AUTOBAHN_CONNECTION_STATUS.OPENED;
                            notifyConnectionIsOpened();
                        }
                        /****************************************************************
                         * NOTIFIERS
                         ***************************************************************/
                        function notifyConnectionIsOpened() {
                            $rootScope.$broadcast(NG_AUTOBAHN_CONNECTION_EVENTS.OPEN, _session);
                        }

                        function notifyConnectionIsClosed(reason) {
                            $rootScope.$broadcast(NG_AUTOBAHN_CONNECTION_EVENTS.CLOSE, reason);
                        }

                        function notifyConnectionIsLost(reason) {
                            $rootScope.$broadcast(NG_AUTOBAHN_CONNECTION_EVENTS.LOST, reason);
                        }
                    }
                }
            ];
        }
    ]);

    /*****************************************************************************/

})(angular);
