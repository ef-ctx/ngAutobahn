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
     *
     *****************************************************************************/
    .provider('ping', [
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
