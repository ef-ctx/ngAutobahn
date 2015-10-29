/*****************************************************************************
 *
 * @ngdoc module
 * @name ngAutobahn.messageBroker
 * @module ngAutobahn.messageBroker
 * @description provides subscription, publishing and utils related with socket messagees
 *
 *****************************************************************************/
angular.module('ngAutobahn.messageBroker', [])

/*****************************************************************************
 *
 * @ngdoc provider
 * @name NgAutobahnMessageBroker
 * @module ngAutobahn.messageBroker
 *
 * @description
 * provides a facade for publish and subcscribe methods
 *
 *****************************************************************************/
.factory('NgAutobahnMessageBroker', [
    '$rootScope',
    function ($rootScope) {
        'use strict';

        return NgAutobahnMessageBroker;

        function NgAutobahnMessageBroker(channel, _publish) {
            var _channel = channel,
                _messageHandlers = {};

            return {
                facade: {
                    publish: publish,
                    subscribe: subscribe,
                    getChannel: getChannel
                },
                messageReceivedHandler: messageReceivedHandler
            };

            /****************************************************************
             * METHODS
             ***************************************************************/
            function subscribe(message, handler) {
                if (!_messageHandlers[message]) {
                    _messageHandlers[message] = [];
                }
                _messageHandlers[message].push(handler);
            }

            function publish(message, payload) {
                return _publish(_channel, message, payload);
            }

            function getChannel() {
                return _channel;

            }

            /****************************************************************
             * HANDLERS
             ***************************************************************/
            function messageReceivedHandler(payloadArray, payload) {
                var channelName = payload.channel,
                    messageName = payload.type,
                    messagePayload = payload.data;

                if (hasHandlerForMessage(channelName, messageName)) {
                    $rootScope.$applyAsync(function() {
                        callHandlers(messageName, messagePayload);
                    });
                }
            }

            /****************************************************************
             * HELPERS
             ***************************************************************/

            function hasHandlerForMessage(channel, name) {
                return (_channel === channel) && (_messageHandlers[name]);
            }

            function callHandlers(msg, payload) {
                var handlers = _messageHandlers[msg];
                for (var ix = 0; ix < handlers.length; ix++) {
                    handlers[ix](payload);
                }
            }
        }
    }
]);
