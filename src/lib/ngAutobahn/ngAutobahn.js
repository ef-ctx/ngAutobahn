(function (angular) {
    'use strict';

    var module = angular.module('ngAutobahn', []);

    /**
     * @ngdoc object
     * @name ngAutobahn.myServiceProvider
     *
     * @description
     * Allows the {@link ngAutobahn.myService} service to be configured.
     */
    module.provider('myService', [

        function myServiceProvider() {

            /**
             * @type {Object} provider configuration.
             */
            var serviceConfig = {};

            /**
             * @ngdoc function
             * @name configure
             * @methodOf ngAutobahn.myServiceProvider
             *
             * @description
             * Configures the {@link ngAutobahn.myService} service.
             *
             * @param {Object} config Object with configuration options, extends base configuration.
             * - someProperty {number}
             */
            this.configure = function (config) {
                angular.extend(serviceConfig, config);
            };

            /**
             * @ngdoc object
             * @name ngAutobahn.myService
             *
             * @description
             * An example service.
             *
             * @property {number} someProperty **Number** *Read-only* Some property.
             */
            this.$get = [
                '$q',
                function myService($q) {

                    var serviceApi = {

                        /**
                         * @ngdoc function
                         * @name someMethod
                         * @methodOf ngAutobahn.myService
                         *
                         * @description
                         * Performs something.
                         *
                         * @param {number} value Some number.
                         * @returns {boolean} Some result.
                         */
                        someMethod: function (value) {
                            return true;
                        }
                    };

                    Object.defineProperty(serviceApi, 'someProperty', {
                        get: function () {
                            return serviceConfig.someProperty;
                        }
                    });

                    return serviceApi;
                }
            ];
        }
    ]);

})(angular);
