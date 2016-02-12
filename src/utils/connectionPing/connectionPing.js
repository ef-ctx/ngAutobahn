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
