/**
 * ngAutobahn - v0.0.5 - 2015-12-07
 * https://github.com/ef-ctx/ngAutobahn
 *
 * Copyright (c) 2015 EF CTX <http://efclass.io>
 * License: MIT <https://raw.githubusercontent.com/EFEducationFirstMobile/oss/master/LICENSE>
 */
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

                            if (_connection) {
                                defer.resolve(_session);
                                _connectionOpenedHandler();
                            } else {
                                _connection = new autobahn.Connection(autobahnOptions);

                                _connection.onopen = function (session) {
                                    _session = session;
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
                         * RESET
                         ***************************************************************/

                        function resetConnection() {
                            _connectionLostHandler();

                            _closeConnection()
                                .then(openConnection);
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

(function (angular) {
    'use strict';

    /*****************************************************************************
     *
     * @ngdoc module
     * @name ngAutobahn.messageBroker
     * @module ngAutobahn.messageBroker
     * @description provides subscription, publishing and utils related with socket messagees
     *
     *****************************************************************************/

    angular.module('ngAutobahn.messageBroker', [])

    /*****************************************************************************
     *
     * @ngdoc provider
     * @name NgAutobahnMessageBroker
     * @module ngAutobahn.messageBroker
     *
     * @description
     * provides a facade for publish and subcscribe methods
     *
     *****************************************************************************/

    .factory('NgAutobahnMessageBroker', [
        '$rootScope',
        function ($rootScope) {

            return NgAutobahnMessageBroker;

            function NgAutobahnMessageBroker(channel, publishFn) {
                var _channel = channel,
                    _messageHandlers = {};

                return {
                    facade: {
                        publish: publish,
                        subscribe: subscribe,
                        getChannel: getChannel // legacy. This should NOT be exposed. See ln 63
                    },
                    messageReceivedHandler: messageReceivedHandler,
                    subscription: null,
                    channel: _channel
                };

                /****************************************************************
                 * METHODS
                 ***************************************************************/

                function subscribe(message, handler) {
                    if (!_messageHandlers[message]) {
                        _messageHandlers[message] = [];
                    }
                    _messageHandlers[message].push(handler);
                }

                function publish(message, payload) {
                    return publishFn(_channel, message, payload);
                }

                /****************************************************************
                 *
                 * IMPORTANT NOTE:
                 *
                 * This is legacy from the services and design we built ngAutobahn for and
                 * should be removed as soon as we refactor it ( Sorry about that :( ).
                 *
                 * The idea is to expose a facade with publish and subscribe only
                 * so that the channel is hidden and lives as a private variable of the Broker.
                 *
                 ***************************************************************/
                function getChannel() {
                    return _channel;
                }

                /****************************************************************
                 * HANDLERS
                 ***************************************************************/

                function messageReceivedHandler(payloadArray, payload) {
                    var channelName = payload.channel,
                        messageName = payload.type,
                        messagePayload = payload.data;

                    if (hasHandlerForMessage(channelName, messageName)) {
                        callHandlers(messageName, messagePayload);
                    }
                }

                /****************************************************************
                 * HELPERS
                 ***************************************************************/

                function hasHandlerForMessage(channel, name) {
                    return (_channel === channel) && (_messageHandlers[name]);
                }

                function callHandlers(msg, payload) {
                    var handlers = _messageHandlers[msg];
                    for (var ix = 0; ix < handlers.length; ix++) {
                        handlers[ix](payload);
                    }
                }
            }
        }
    ]);

    /*****************************************************************************/

})(angular);

(function (angular) {
    'use strict';

    angular.module('ngAutobahn', [
        'ngAutobahn.connection',
        'ngAutobahn.session'
    ]);

})(angular);

(function (angular) {
    'use strict';

    /*****************************************************************************
     *
     * @ngdoc module
     * @name ngAutobahn.session
     * @module ngAutobahn.session
     * @description
     *
     *****************************************************************************/
    angular.module('ngAutobahn.session', [
        'ngAutobahn.connection',
        'ngAutobahn.messageBroker'
    ])

    /*****************************************************************************
     *
     * @ngdoc service
     * @name ngAutobahn.session
     * @module ngAutobahn.session
     * @description
     *
     *****************************************************************************/
    .service('ngAutobahnSession', [
        '$q',
        '$rootScope',
        'ngAutobahnConnection',
        'NgAutobahnMessageBroker',
        'NG_AUTOBAHN_CONNECTION_EVENTS',
        function ngAutobahnSessionService(
            $q,
            $rootScope,
            ngAutobahnConnection,
            NgAutobahnMessageBroker,
            NG_AUTOBAHN_CONNECTION_EVENTS
        ) {

            return new NgAutobahnSession();

            function NgAutobahnSession() {
                var self = this,
                    _session,
                    _brokers = {};

                this.subscribe = subscribe;
                this.remoteCall = remoteCall;
                this.end = end;
                this.unsubscribeBroker = unsubscribeBroker;

                $rootScope.$on(NG_AUTOBAHN_CONNECTION_EVENTS.OPEN, connectionOpenedHandler);
                $rootScope.$on(NG_AUTOBAHN_CONNECTION_EVENTS.CLOSE, connectionClosedHandler);
                $rootScope.$on(NG_AUTOBAHN_CONNECTION_EVENTS.LOST, connectionClosedHandler);

                /****************************************************************
                 * SUBSCRIBE
                 ***************************************************************/
                function subscribe(channel) {
                    var defer = $q.defer(),
                        broker = new NgAutobahnMessageBroker(channel, publish);

                    if (!channel) {
                        throw new Error('ngAutobahn.session.subscribe error: Trying to subscribe without specifying channel');
                    }

                    if (!_session) {
                        ngAutobahnConnection.openConnection()
                            .then(_setSession)
                            .finally(resolveBroker);
                    } else {
                        resolveBroker();
                    }

                    return defer.promise;

                    function resolveBroker() {
                        _subscribeBroker(broker);
                        defer.resolve(broker.facade);
                    }
                }

                function _setSession(session) {
                    _session = session;
                }

                function _subscribeBroker(broker) {
                    _session.subscribe(broker.channel, broker.messageReceivedHandler)
                        .then(linkSubscriptionToBroker);

                    function linkSubscriptionToBroker(subscription) {
                        broker.subscription = subscription;
                        _brokers[subscription.id] = broker;
                    }
                }

                function subscribeHandlers() {
                    for (var brokerId in _brokers) {
                        var broker = _brokers[brokerId];
                        _subscribeBroker(broker);
                    }
                }

                /****************************************************************
                 * SUBSCRIBE
                 ***************************************************************/

                function unsubscribeBroker(brokerFacade) {
                    if (!brokerFacade) {
                        throw new Error('ngAutobahnSession.unsubscribeBroker error. No broker provided');
                    } else {
                        var broker = _getBrokerByBrokerFacade(brokerFacade);
                        _unsubscribeBroker(broker);
                    }
                }

                /****************************************************************
                 * CONNECTION EVENT HANDLERS
                 ***************************************************************/
                function connectionOpenedHandler(evt, session) {
                    if (!_session) {
                        _session = session;
                        subscribeHandlers();
                    }
                }

                function connectionClosedHandler(evt, reason) {
                    _unsubscribeAllBrokers();
                    _session = null;
                }

                /****************************************************************
                 * REMOTE CALL
                 ***************************************************************/
                function remoteCall(methodName, payload) {
                    var _payload = payload || {};

                    return (!_session) ?
                        ngAutobahnConnection.openConnection().then(invokeRemoteCall) :
                        invokeRemoteCall();

                    function invokeRemoteCall() {
                        return _session.call(methodName, [], _payload);
                    }

                }

                /****************************************************************
                 * PUBLISH
                 ***************************************************************/
                function publish(channel, message, payload) {
                    var _defer = $q.defer(),
                        _payload, _options;

                    if (_session) {
                        _payload = formatPublishPayload(message, payload);
                        _options = {
                            acknowledge: true
                        };

                        _session.publish(channel, [], formatPublishPayload(message, payload), _options)
                            .then(_defer.resolve, _defer.reject)
                            .finally($rootScope.$applyAsync);
                    } else {
                        _defer.reject('ngAutobahnConnection error no session was established');
                    }

                    return _defer.promise;
                }

                function formatPublishPayload(message, payload) {
                    return {
                        type: message,
                        data: payload || {}
                    };
                }

                /****************************************************************
                 * CLOSE
                 ***************************************************************/

                function end() {
                    return _destroy();
                }

                /****************************************************************
                 * DESTROY
                 ***************************************************************/
                function _destroy() {
                    var defer = $q.defer();

                    _unsubscribeAllBrokers();

                    _cleanAllBrokers();

                    ngAutobahnConnection.closeConnection()
                        .then(defer.resolve, defer.reject);

                    return defer.promise;
                }

                function _unsubscribeBroker(broker) {
                    _session.unsubscribe(broker.subscription);
                }

                function _unsubscribeAllBrokers() {
                    for (var brokerId in _brokers) {
                        _unsubscribeBroker(_brokers[brokerId]);
                    }
                }

                function _cleanAllBrokers() {
                    _brokers = {};
                }

                function _getBrokerByBrokerFacade(brokerFacade) {
                    var broker;

                    for (var brokerId in _brokers) {
                        broker = _brokers[brokerId];
                        if (brokerFacade === broker.facade) {
                            return broker;
                        }
                    }

                    return null;
                }
            }
        }
    ]);

    /*****************************************************************************/

})(angular);

(function (angular) {
    'use strict';

    /**********************************************************
     *
     * @ngdoc module
     * @name ngAutobahn.utils.connectionPing
     * @module ngAutobahn.utils.connectionPing
     * @description provides a configurable way to ping the server using a configurable rpc call
     *
     **********************************************************/

    angular.module('ngAutobahn.utils.connectionPing', [
        'ngAutobahn',
        'ngAutobahn.utils.ping'
    ])

    /**********************************************************
     *
     * @ngdoc provider
     * @name ngAutobahnConnectionPing
     * @module ngAutobahn.utils.connectionPing
     *
     **********************************************************/

    .provider('ngAutobahnConnectionPing', [
        'NgAutobahnPingProvider',
        function (NgAutobahnPingProvider) {
            var self = this,
                configuration = {
                    pingMessage: 'ping',
                    delay: 1500,
                    maxResponseDelay: 3000
                };

            NgAutobahnPingProvider.configure({
                delay: configuration.delay,
                maxResponseDelay: configuration.maxResponseDelay
            });

            self.configure = function configure(config) {
                angular.extend(configuration, config);
                return configuration;
            };

            self.$get = [
                '$rootScope',
                'ngAutobahnConnection',
                'ngAutobahnSession',
                'NgAutobahnPing',
                'NG_AUTOBAHN_CONNECTION_EVENTS',
                function (
                    $rootScope,
                    ngAutobahnConnection,
                    ngAutobahnSession,
                    NgAutobahnPing,
                    NG_AUTOBAHN_CONNECTION_EVENTS
                ) {

                    return new NgAutobahnConnectionPing();

                    function NgAutobahnConnectionPing() {
                        var self = this,
                            _ping = new NgAutobahnPing(pingFn, errorFn);

                        self.activate = function () {
                            $rootScope.$on(NG_AUTOBAHN_CONNECTION_EVENTS.OPEN, _ping.start);
                            $rootScope.$on(NG_AUTOBAHN_CONNECTION_EVENTS.LOST, _ping.stop);
                            $rootScope.$on(NG_AUTOBAHN_CONNECTION_EVENTS.CLOSE, _ping.stop);

                            if (ngAutobahnConnection.isOpened) {
                                _ping.start();
                            }
                        };

                        /****************************************************************
                         * PING FUNCTIONS
                         ***************************************************************/

                        function errorFn() {
                            return ngAutobahnConnection.resetConnection();
                        }

                        function pingFn() {
                            return ngAutobahnSession.remoteCall(configuration.pingMessage);
                        }

                    }
                }
            ];
        }
    ]);

})(angular);

(function (angular) {
    'use strict';

    /*****************************************************************************
     *
     * @ngdoc module
     * @name ngAutobahn.connection
     * @module ngAutobahn.connection
     * @description module for ping util
     *
     *****************************************************************************/

    angular.module('ngAutobahn.utils.ping', [])

    /*****************************************************************************
     *
     * @ngdoc provider
     * @name NgAutobahnPing
     * @module ngAutobahn.connection
     *
     * @description
     * invokes an async function provided repeatedly in a configured interval and
     * if it does not resolve in a configured period of time ivokes the errorFn provided.
     *
     *****************************************************************************/

    .provider('NgAutobahnPing', [

        function () {

            var self = this,
                config = {
                    delay: 1500,
                    maxResponseDelay: 3000
                };

            self.configure = function (configuration) {
                angular.extend(config, configuration);
            };

            self.$get = [
                '$timeout',
                '$interval',
                function NgAutobahnPingFactory($timeout, $interval) {
                    return NgAutobahnPing;

                    function NgAutobahnPing(pingFn, errorFn) {
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
    ]);

    /*****************************************************************************/

})(angular);
