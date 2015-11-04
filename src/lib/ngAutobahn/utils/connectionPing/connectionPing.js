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
        'PingProvider',
        function (PingProvider) {
            var self = this,
                configuration = {
                    pingMessage: 'ping',
                    delay: 1500,
                    maxResponseDelay: 3000
                };

            PingProvider.configure({
                delay: configuration.delay,
                maxResponseDelay: configuration.maxResponseDelay
            });

            self.configure = function configure(config) {
                angular.extend(configuration, config);
            };

            self.$get = [
                '$rootScope',
                'ngAutobahnConnection',
                'ngAutobahnSession',
                'Ping',
                'NG_AUTOBAHN_CONNECTION_EVENTS',
                function (
                    $rootScope,
                    ngAutobahnConnection,
                    ngAutobahnSession,
                    Ping,
                    NG_AUTOBAHN_CONNECTION_EVENTS
                ) {

                    return new NgAutobahnConnectionPing();

                    function NgAutobahnConnectionPing() {
                        var self = this,
                            _ping = new Ping(pingFn, errorFn);

                        self.activate = function () {
                            $rootScope.$on(NG_AUTOBAHN_CONNECTION_EVENTS.OPEN, connectionOpenedHandler);

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

                        /****************************************************************
                         * CONNECTION EVENT HANDLERS
                         ***************************************************************/

                        function connectionOpenedHandler(evt, session) {
                            _ping.start();
                        }

                    }
                }
            ];
        }
    ]);

})(angular);
