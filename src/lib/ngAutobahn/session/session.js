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
                    _subscriptions = [],
                    _brokers = {};

                this.subscribe = subscribe;
                this.remoteCall = remoteCall;
                this.end = end;

                $rootScope.$on(NG_AUTOBAHN_CONNECTION_EVENTS.OPEN, connectionOpenedHandler);
                $rootScope.$on(NG_AUTOBAHN_CONNECTION_EVENTS.CLOSE, connectionClosedHandler);
                $rootScope.$on(NG_AUTOBAHN_CONNECTION_EVENTS.LOST, connectionClosedHandler);

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

                    _cleanAllSubscriptions();

                    cleanAllBrokers();

                    ngAutobahnConnection.closeConnection()
                        .then(defer.resolve, defer.reject);

                    return defer.promise;
                }

                function _cleanAllSubscriptions() {
                    if (_subscriptions.length > 0) {
                        _session.unsubscribe(_subscriptions.pop());
                        return _cleanAllSubscriptions();
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
