/**********************************************************
 * 
 * ngAutobahn - v0.0.24
 * 
 * Release date : 2016-04-12 : 15:02
 * Author       : Jaime Beneytez - EF CTX 
 * License      : MIT 
 * 
 **********************************************************/



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

                                if(type === 'lost') {
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
                        $rootScope.$applyAsync();
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

(function(angular) {
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
                    _brokers = [];

                this.subscribe = subscribe;
                this.remoteCall = remoteCall;
                this.unsubscribeBroker = unsubscribeBroker;
                this.end = end;

                $rootScope.$on(NG_AUTOBAHN_CONNECTION_EVENTS.OPEN, connectionOpenedHandler);
                $rootScope.$on(NG_AUTOBAHN_CONNECTION_EVENTS.CLOSE, connectionClosedHandler);
                $rootScope.$on(NG_AUTOBAHN_CONNECTION_EVENTS.LOST, connectionLostHandler);

                /****************************************************************
                 * SUBSCRIBE
                 ***************************************************************/

                function subscribe(channel) {
                    if (!channel) {
                        throw new Error('ngAutobahn.session.subscribe error: Trying to subscribe without specifying channel');
                    }

                    if (_session) {
                        return createBroker();
                    } else {
                        return _openSession()
                            .then(createBroker)
                            .catch(onOpenConnectionError);
                    }

                    function createBroker() {
                        return _createBroker(channel);
                    }

                    function onOpenConnectionError(error) {
                        $q.reject('ngAutobahnSession.subscribe Error: ', error);
                        _cleanSession();
                    }
                }


                /****************************************************************
                 * REMOTE CALL
                 ***************************************************************/

                function remoteCall(methodName, payload) {

                    return (_session) ? invokeRemoteCall() : _openSession().then(invokeRemoteCall);

                    function invokeRemoteCall() {
                        return (_session.isOpen) ? _session.call(methodName, [], payload || {}): $q.reject('session is not open');
                    }

                }

                /****************************************************************
                 * UNSUBSCRIBE BROKER
                 ***************************************************************/

                function unsubscribeBroker(brokerFacade) {
                    if (!brokerFacade) {
                        throw new Error('ngAutobahnSession.unsubscribeBroker error. No broker provided');
                    } else {
                        return _unsubscribeBroker(_getBrokerByBrokerFacade(brokerFacade))
                            .then(_deleteBroker);
                    }
                }

                /****************************************************************
                 * END
                 ***************************************************************/

                function end() {
                    var defer = $q.defer();

                    _unsubscribeAllBrokers();

                    _cleanAllBrokers();

                    ngAutobahnConnection.closeConnection()
                        .then(defer.resolve, defer.reject);

                    return defer.promise;
                }

                /****************************************************************
                 * CONNECTION EVENT HANDLERS
                 ***************************************************************/

                function connectionOpenedHandler(evt, session) {
                    if (!_session) {
                        _setSession(session);
                        _resubscribeBrokers();
                    }
                }

                function connectionClosedHandler(evt, reason) {
                    _cleanAllBrokers();
                    _cleanSession();
                }

                function connectionLostHandler(evt, reason) {
                    _cleanSession();
                }


                /****************************************************************
                 * PUBLISH
                 ***************************************************************/

                function publish(channel, message, payload) {
                    var _defer = $q.defer(),
                        _payload = {
                            type: message,
                            data: payload || {}
                        },
                        _options = {
                            acknowledge: true
                        };

                    if (_session) {
                        _session.publish(channel, [], _payload, _options).then(_defer.resolve, _defer.reject);
                    } else {
                        _defer.reject('ngAutobahnConnection error no session was established');
                    }

                    return _defer.promise;
                }

                /****************************************************************
                 * HELPERS
                 ***************************************************************/

                // Session

                function _openSession() {
                    return ngAutobahnConnection.openConnection()
                        .then(_setSession);
                }

                function _setSession(session) {
                    _session = session;
                }

                function _cleanSession() {
                    _session = null;
                }


                // Brokers : @TODO: Build an object to encapsulate this logic

                // create --------------------------------------------------
                //
                function _createBroker(channel) {
                    var broker = new NgAutobahnMessageBroker(channel, publish);

                    return _subscribeBroker(broker)
                        .then(resolveBrokerFacade)
                        .finally(storeBroker);

                    function storeBroker() {
                        _brokers.push(broker);
                    }

                    function resolveBrokerFacade() {
                        return broker.facade;
                    }
                }

                // delete --------------------------------------------------

                function _deleteBroker(broker) {
                    return _brokers.splice(_brokers.indexOf(broker), 1);
                }

                function _cleanAllBrokers() {
                    _brokers = [];
                }

                // retrieve --------------------------------------------------

                function _getBrokerByBrokerFacade(brokerFacade) {
                    var broker;

                    for (var ix = 0; ix < _brokers.length; ix++) {
                        broker = _brokers[ix];
                        if (broker.facade === brokerFacade) {
                            return broker;
                        }
                    }

                    return null;
                }

                // subscribe --------------------------------------------------

                function _subscribeBroker(broker) {

                    return _session.subscribe(broker.channel, broker.messageReceivedHandler)
                        .then(assignSubscription)
                        .catch($q.reject);

                    function assignSubscription(subscription) {
                        broker.subscription = subscription;
                        return broker;
                    }

                }

                function _resubscribeBrokers() {
                    _brokers.forEach(_subscribeBroker);
                }


                // unsubscribe --------------------------------------------------

                function _unsubscribeBroker(broker) {
                    var defer = $q.defer();

                    _session.unsubscribe(broker.subscription)
                        .then(_resolveBroker, defer.reject);

                    return defer.promise;

                    function _resolveBroker() {
                        defer.resolve(broker);
                    }
                }

                function _unsubscribeAllBrokers() {
                    _brokers.forEach(_unsubscribeBroker);
                }

            }
        }
    ]);

    /*****************************************************************************/

}(angular));





(function(angular) {
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
    ]).provider('ngAutobahnConnectionPing', [
        'NgAutobahnPingProvider',
        $ngAutobahnConnectionPingProvider
    ]);

    /**********************************************************
     *
     * @ngdoc provider
     * @name ngAutobahnConnectionPing
     * @module ngAutobahn.utils.connectionPing
     *
     **********************************************************/


    function $ngAutobahnConnectionPingProvider(NgAutobahnPingProvider) {
        var self = this,
            configuration = {
                pingMessage: 'ping',
                intervalMs: 3000
            };

        this.configure = configure;

        this.$get = [
            '$rootScope',
            'ngAutobahnConnection',
            'ngAutobahnSession',
            'NgAutobahnPing',
            'NG_AUTOBAHN_CONNECTION_EVENTS',
            $get
        ];

        function configure(config) {
            angular.extend(configuration, config);
            _configurePing(configuration);
            return configuration;
        }

        function _configurePing(config) {
            NgAutobahnPingProvider.configure(config);
        }

        function $get(
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

                self.activate = function() {
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
    }

})(angular);

(function(angular) {
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
        .provider('NgAutobahnPing', [
            $NgAutobahnPingProvider
        ]);

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

    function $NgAutobahnPingProvider() {

        var self = this,
            config = {
                intervalMs: 3000
            };

        this.configure = configure;

        this.$get = [
            '$timeout',
            '$interval',
            $NgAutobahnPingFactory
        ];

        function configure(configuration) {
            angular.extend(config, configuration);
        }

        function $NgAutobahnPingFactory($timeout, $interval) {

            return NgAutobahnPing;

            function NgAutobahnPing(pingFn, errorFn) {
                var _isPingPromiseResolved = true,
                    _interval;

                this.start = start;
                this.stop = stop;

                function start() {
                    if (_interval) {
                        _clearInterval();
                    }
                    _interval = $interval(_intervalHandler, config.intervalMs, 0, false);
                }

                function _intervalHandler() {
                    if (_isPingPromiseResolved) {
                        _invokePingFn();
                    } else {
                        _clearInterval();
                        _invokeErrorFn();
                    }
                }

                function stop() {
                    _clearInterval();
                    _isPingPromiseResolved = true;
                }

                function _invokePingFn() {
                    _isPingPromiseResolved = false;
                    pingFn().then(_pingFunctionResolvedHandler);
                }

                function _invokeErrorFn() {
                    errorFn();
                }

                function _pingFunctionResolvedHandler() {
                    _isPingPromiseResolved = true;
                }

                function _clearInterval() {
                    $interval.cancel(_interval);
                    _interval = null;
                }
            }
        }
    }

    /*****************************************************************************/

})(angular);
