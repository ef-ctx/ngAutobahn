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
                        delete _brokers[broker.subscription.id];
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

                /****************************************************************
                 * HELPERS
                 ***************************************************************/

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
