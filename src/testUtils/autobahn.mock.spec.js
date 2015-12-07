/**********************************************************
 *
 * @ngdoc module
 * @name autobahn.mock
 * @module autobahn.mock
 *
 **********************************************************/

angular.module('autobahn.mock', [])

/**********************************************************
 *
 * @ngdoc service
 * @name autobahnMock
 * @module autobahn.mock
 *
 **********************************************************/

.service('autobahn', [
    '$q',
    '$timeout',
    function autobahnMock($q, $timeout) {
        'use strict';

        var self = this,
            _isConnected = true,
            _restablishAfterClose = false;

        self.connection = Connection;
        self.session = Session;
        self.dropConnection = dropConnection;
        self.restablishConnection = restablishConnection;
        self.isConnected = isConnected;

        /**********************************************************
         * CONNECTION
         **********************************************************/
        function Connection() {}

        Connection.prototype.close = function () {
            var self = this;
            $timeout(function () {
                if (_restablishAfterClose) {
                    _isConnected = true;
                }
                self.onclose();
            });
        };

        Connection.prototype.open = function () {
            var self = this;

            $timeout(function () {
                if (isConnected()) {
                    self.onopen(new Session());
                } else {
                    self.onclose();
                }
            });
        };

        /**********************************************************
         * SESSION
         **********************************************************/

        function Session() {}

        Session.prototype.call = function (message) {
            var defer = $q.defer();
            $timeout(function () {
                if (isConnected()) {
                    defer.resolve();
                } else {
                    $timeout.flush();
                }
            });
            return defer.promise;
        };

        /**********************************************************
         * HELPERS
         **********************************************************/

        function isConnected() {
            return _isConnected;
        }

        function dropConnection(once) {
            if (once) {
                _restablishAfterClose = true;
            }
            _isConnected = false;
        }

        function restablishConnection() {
            _isConnected = true;
        }

    }
])

/**********************************************************/
;
