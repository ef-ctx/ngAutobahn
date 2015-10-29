/*globals autobahn:true*/

/*****************************************************************************
 *
 * @ngdoc module
 * @name ngAutobahn.connection
 * @module ngAutobahn.connection
 * @description module for socket connection matters
 *
 *****************************************************************************/
angular.module('ngAutobahn.connection', [])

/*****************************************************************************
 *
 * @ngdoc provider
 * @name ping
 * @module ngAutobahn.connection
 *
 * @description
 * invokes an async function provided repeatedly in a configured interval and
 * if it does not resolve in a configured period of time ivokes the errorFn provided.
 *
 *
 *****************************************************************************/
.provider('ping', [
    function() {
        'use strict';

        var config = {
            delay: 1500,
            maxResponseDelay: 3000
        };

        this.configure = function(configuration) {
            angular.extend(config, configuration);
        };

        this.$get = [
            '$timeout',
            '$interval',
            function($timeout, $interval) {
                return Ping;

                function Ping(pingFn, errorFn) {
                    var self = this,
                        _timeout,
                        _interval;

                    self.start = start;
                    self.stop = stop;

                    function start() {
                        stop();
                        sendPingMessage();
                        _interval = $interval(sendPingMessage, config.delay, 0, false);
                    }

                    function stop() {
                        clearTimeout();
                        clearInterval();
                    }

                    function sendPingMessage() {
                        _timeout = $timeout(_maxResponseDelayReachedHandler, config.maxResponseDelay);
                        pingFn().then(clearTimeout);
                    }

                    function _maxResponseDelayReachedHandler() {
                        stop();
                        errorFn();
                    }

                    function clearTimeout() {
                        $timeout.cancel(_timeout);
                    }

                    function clearInterval() {
                        $interval.cancel(_interval);
                    }
                }
            }
        ];
    }
])

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
    'pingProvider',
    function ngAutobahnConnectionProvider(pingProvider) {
        'use strict';

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
        this.configure = function(config) {
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

            pingProvider.configure({
                delay: serviceConfig.ping.delay,
                maxResponseDelay: serviceConfig.ping.timeout
            });
        };

        this.$get = [
            '$q',
            '$rootScope',
            'ping',
            'NG_AUTOBAHN_CONNECTION_EVENTS',
            function($q, $rootScope, ping, NG_AUTOBAHN_CONNECTION_EVENTS) {
                return new CxSocketConnection();

                function CxSocketConnection() {
                    var self = this,
                        _session,
                        _connection,
                        _ping = new ping(pingFn, reconnect);

                    self.openConnection = openConnection;
                    self.closeConnection = closeConnection;

                    /****************************************************************
                     * OPEN
                     ***************************************************************/
                    function openConnection() {
                        var defer = $q.defer();

                        if (_connection) {
                            defer.resolve(_session);
                            notifyConnectionIsOpened();
                        } else {
                            _connection = new autobahn.Connection(autobahnOptions);

                            _connection.onopen = function(session) {
                                _session = session;
                                _ping.start();
                                defer.resolve(session);
                                notifyConnectionIsOpened();
                            };

                            _connection.onclose = function(reason) {
                                defer.reject();
                                notifyConnectionIsLost(reason);
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
                            .then(notifyConnectionIsClosed);
                    }

                    /****************************************************************
                     * HELPERS
                     ***************************************************************/

                    function _closeConnection() {
                        var defer = $q.defer();

                        if (_connection) {
                            _ping.stop();
                            _connection.onclose = function(reason) {
                                _connection = null;
                                defer.resolve();
                            };
                            _connection.close();
                        } else {
                            defer.reject();
                        }

                        return defer.promise;
                    }

                    function reconnect() {
                        notifyConnectionIsLost();

                        _closeConnection()
                            .then(openConnection);
                    }

                    function pingFn() {
                        return _session.call('ping');
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
