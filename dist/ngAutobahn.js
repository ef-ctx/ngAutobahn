/**
 * ngAutobahn - v0.0.1 - 2015-11-02
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
    angular.module('ngAutobahn.connection', [
        'ngAutobahn.utils.ping'
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
                'NG_AUTOBAHN_CONNECTION_EVENTS',
                function ($q, $rootScope, Ping, NG_AUTOBAHN_CONNECTION_EVENTS) {

                    return new CxSocketConnection();

                    function CxSocketConnection() {
                        var self = this,
                            _session,
                            _connection,
                            _ping = new Ping(pingFn, reconnect);

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

                                _connection.onopen = function (session) {
                                    _session = session;
                                    _ping.start();
                                    defer.resolve(session);
                                    notifyConnectionIsOpened();
                                };

                                _connection.onclose = function (reason) {
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

            function NgAutobahnMessageBroker(channel, _publish) {
                var _channel = channel,
                    _messageHandlers = {};

                return {
                    facade: {
                        publish: publish,
                        subscribe: subscribe,
                        getChannel: getChannel
                    },
                    messageReceivedHandler: messageReceivedHandler
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
                    return _publish(_channel, message, payload);
                }

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
                        $rootScope.$applyAsync(function () {
                            callHandlers(messageName, messagePayload);
                        });
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

            return new NgAutobachSession();

            function NgAutobachSession() {
                var self = this,
                    _session,
                    _subscriptions = [],
                    _brokers = {};

                this.subscribe = subscribe;
                this.remoteCall = remoteCall;
                this.destroy = destroy;

                $rootScope.$on(NG_AUTOBAHN_CONNECTION_EVENTS.CLOSE, connectionClosedHandler);
                $rootScope.$on(NG_AUTOBAHN_CONNECTION_EVENTS.LOST, connectionClosedHandler);

                $rootScope.$on(NG_AUTOBAHN_CONNECTION_EVENTS.OPEN, connectionOpenedHandler);

                /****************************************************************
                 * SUBSCRIBE
                 ***************************************************************/
                function subscribe(channel) {
                    var defer = $q.defer(),
                        broker = createBroker(channel);

                    if (!channel) {
                        throw new Error('ngAutobahn.session.subscribe error: Trying to subscribe withous specifying channel');
                    }

                    if (!_session) {
                        ngAutobahnConnection.openConnection()
                            .then(_setSession)
                            .finally(resolveBroker);
                    } else {
                        subscribeBrokerToSessionChannel(broker, channel);
                        resolveBroker();
                    }

                    return defer.promise;

                    function resolveBroker() {
                        defer.resolve(broker.facade);
                    }
                }

                function _setSession(session) {
                    _session = session;
                }

                function createBroker(channel) {
                    var broker = new NgAutobahnMessageBroker(channel, publish);

                    if (!_brokers[channel]) {
                        _brokers[channel] = [];
                    }
                    _brokers[channel].push(broker);

                    return broker;
                }

                function subscribeBrokerToSessionChannel(broker, channel) {
                    var subscription = _session.subscribe(channel, broker.messageReceivedHandler)
                        .then(storeSubscription);

                    function storeSubscription(subscription) {
                        _subscriptions.push(subscription);
                    }
                }

                function subscribeHandlers() {
                    for (var channel in _brokers) {
                        var brokers = _brokers[channel];
                        for (var ix = 0; ix < brokers.length; ix++) {
                            subscribeBrokerToSessionChannel(brokers[ix], channel);
                        }
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
                    _session = null;
                    _subscriptions = [];
                }

                /****************************************************************
                 * REMOTE CALL
                 ***************************************************************/
                function remoteCall(methodName, payload) {
                    var _defer = $q.defer(),
                        _payload = payload || {};

                    if (!_session) {
                        ngAutobahnConnection.openConnection()
                            .then(invokeRemoteCall);
                    } else {
                        invokeRemoteCall();
                    }

                    return _defer.promise;

                    function invokeRemoteCall() {
                        _session.call(methodName, [], payload)
                            .then(_defer.resolve, _defer.reject)
                            .finally($rootScope.$applyAsync);
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
                 * DESTROY
                 ***************************************************************/
                function destroy() {
                    var defer = $q.defer();

                    cleanAllSubscriptions();

                    cleanAllBrokers();

                    ngAutobahnConnection.closeConnection()
                        .then(defer.resolve, defer.reject);

                    return defer.promise;
                }

                function cleanAllSubscriptions() {
                    if (_subscriptions.length > 0) {
                        _session.unsubscribe(_subscriptions.pop());
                        return cleanAllSubscriptions();
                    }
                }

                function cleanAllBrokers() {
                    _brokers = [];
                }
            }
        }
    ]);

    /*****************************************************************************/

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
     * @name ping
     * @module ngAutobahn.connection
     *
     * @description
     * invokes an async function provided repeatedly in a configured interval and
     * if it does not resolve in a configured period of time ivokes the errorFn provided.
     *
     *****************************************************************************/

    .provider('Ping', [
        function () {

            var config = {
                delay: 1500,
                maxResponseDelay: 3000
            };

            this.configure = function (configuration) {
                angular.extend(config, configuration);
            };

            this.$get = [
                '$timeout',
                '$interval',
                function ($timeout, $interval) {
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
    ]);

    /*****************************************************************************/

})(angular);
