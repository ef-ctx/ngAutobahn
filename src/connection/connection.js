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
    angular.module('ngAutobahn.connection', [])

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

        function ngAutobahnConnectionProvider() {
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
            };

            this.$get = [
                '$q',
                '$rootScope',
                'NG_AUTOBAHN_CONNECTION_STATUS',
                'NG_AUTOBAHN_CONNECTION_EVENTS',
                function (
                    $q,
                    $rootScope,
                    NG_AUTOBAHN_CONNECTION_STATUS,
                    NG_AUTOBAHN_CONNECTION_EVENTS
                ) {

                    return new CxSocketConnection();

                    function CxSocketConnection() {
                        var self = this,
                            _session,
                            _connection,
                            _status = NG_AUTOBAHN_CONNECTION_STATUS.CLOSED;

                        self.openConnection = openConnection;
                        self.closeConnection = closeConnection;
                        self.resetConnection = resetConnection;

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

                            if (_connection && _session) {
                                defer.resolve(_session);
                                _connectionOpenedHandler();
                            } else {
                                _connection = new autobahn.Connection(autobahnOptions);
                                _connection.onopen = onOpen;
                                _connection.onclose = onErrorOpening;
                                _connection.open();
                            }

                            return defer.promise;

                            function onCloseAndNotify(type, details) {
                                _connection.onclose = null;

                                if(type == 'lost') {
                                    _connectionLostHandler(details);
                                    return;
                                }

                                _connection = null;
                                _connectionClosedHandler(details);
                            }

                            function onErrorOpening() {
                                _connection.onclose = null;
                                defer.reject();
                            }

                            function onOpen(session) {
                                _session = session;
                                defer.resolve(_session);

                                _connectionOpenedHandler(_session);
                                _connection.onclose = onCloseAndNotify;
                            }
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
                                _connection.onclose = connectionCloseHandler;
                                _connection.close();
                            } else {
                                defer.reject();
                            }

                            return defer.promise;

                            function connectionCloseHandler(type, details) {
                                _connection.onclose = null;
                                _connection = null;
                                defer.resolve(details);
                            }
                        }

                        /****************************************************************
                         * RESET
                         ***************************************************************/

                        function resetConnection() {

                            _connectionLostHandler({reason:'connection.reset'});

                            _closeConnection()
                                .then(openConnection);
                        }

                        /****************************************************************
                         * HANDLERS
                         ***************************************************************/

                        function _connectionOpenedHandler(details) {

                            _changeStatus(
                                NG_AUTOBAHN_CONNECTION_STATUS.OPENED,
                                details,
                                NG_AUTOBAHN_CONNECTION_EVENTS.OPEN
                            );
                        }

                        function _connectionClosedHandler(details) {

                            _changeStatus(
                                NG_AUTOBAHN_CONNECTION_STATUS.CLOSED,
                                details,
                                NG_AUTOBAHN_CONNECTION_EVENTS.CLOSE
                            );
                        }

                        function _connectionLostHandler(details) {

                            _changeStatus(
                                NG_AUTOBAHN_CONNECTION_STATUS.LOST,
                                details,
                                NG_AUTOBAHN_CONNECTION_EVENTS.LOST
                            );
                        }

                        /****************************************************************
                         * NOTIFIERS
                         ***************************************************************/

                        function _changeStatus(status, details, eventType) {
                            var previousStatus = _status;
                            _status = status;
                            $rootScope.$broadcast(eventType, details, previousStatus);
                        }
                    }
                }
            ];
        }
    ]);

    /*****************************************************************************/

})(angular);
