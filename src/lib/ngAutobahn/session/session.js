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
                $rootScope.$on(NG_AUTOBAHN_CONNECTION_EVENTS.LOST, connectionLostHandler);

                /****************************************************************
                 * SUBSCRIBE
                 ***************************************************************/
                function subscribe(channel) {
                    var defer = $q.defer();

                    if (!channel) {
                        throw new Error('ngAutobahn.session.subscribe error: Trying to subscribe without specifying channel');
                    }

                    if (_session) {
                        resolveBroker();
                    } else {
                        _openSession().then(resolveBroker, handleError);
                    }

                    return defer.promise;

                    function resolveBroker() {
                        defer.resolve(_createBroker(channel));
                    }

                    function handleError(error) {
                        defer.reject('ngAutobahnSession.subscribe Error: ', error);
                    }
                }

                function _createBroker(channel) {
                    var broker = new NgAutobahnMessageBroker(channel, publish);

                    _subscribeBroker(broker)
                        .then(storeBroker);

                    return broker.facade;

                    function storeBroker(subscription) {
                        broker.subscription = subscription;
                        _brokers[subscription.id] = broker;
                    }
                }

                /****************************************************************
                 * CONNECTION EVENT HANDLERS
                 ***************************************************************/
                function connectionOpenedHandler(evt, session) {
                    if (!_session) {
                        _setSession(session);
                        _subscribeBrokerHandlers();
                    }
                }

                function connectionClosedHandler(evt, reason) {
                    _unsubscribeAllBrokers();
                    _cleanSession();
                }

                function connectionLostHandler(evt, reason) {
                    _cleanSession();
                }

                /****************************************************************
                 * REMOTE CALL
                 ***************************************************************/
                function remoteCall(methodName, payload) {

                    return (_session) ? invokeRemoteCall() : _openSession().then(invokeRemoteCall);

                    function invokeRemoteCall() {
                        return _session.call(methodName, [], payload || {});
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

                        _session.publish(channel, [], _payload, _options)
                            .then(_defer.resolve, _defer.reject);
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

                function _cleanSession() {
                    _session = null;
                }

                function _openSession() {
                    return ngAutobahnConnection.openConnection()
                        .then(_setSession);
                }

                function _setSession(session) {
                    _session = session;
                }

                /****************************************************************
                 * BROKER HELPERS
                 ***************************************************************/

                function unsubscribeBroker(brokerFacade) {
                    if (!brokerFacade) {
                        throw new Error('ngAutobahnSession.unsubscribeBroker error. No broker provided');
                    } else {
                        return _unsubscribeBroker(_getBrokerByBrokerFacade(brokerFacade))
                            .then(_deleteBroker);
                    }
                }

                function _deleteBroker(broker) {
                    delete _brokers[broker.subscription.id];
                }

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

                function _subscribeBroker(broker) {
                    return _session.subscribe(broker.channel, broker.messageReceivedHandler);
                }

                function _subscribeBrokerHandlers() {
                    for (var brokerId in _brokers) {
                        var broker = _brokers[brokerId];
                        _subscribeBroker(broker);
                    }
                }

            }

        }
    ]);

    /*****************************************************************************/

})(angular);
