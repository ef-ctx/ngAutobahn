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
