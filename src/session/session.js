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




