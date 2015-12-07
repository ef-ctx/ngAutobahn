(function (angular) {
    'use strict';

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

            return NgAutobahnMessageBroker;

            function NgAutobahnMessageBroker(channel, publishFn) {
                var _channel = channel,
                    _messageHandlers = {};

                return {
                    facade: {
                        publish: publish,
                        subscribe: subscribe,
                        getChannel: getChannel // legacy. This should NOT be exposed. See ln 63
                    },
                    messageReceivedHandler: messageReceivedHandler,
                    subscription: null,
                    channel: _channel
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
                    return publishFn(_channel, message, payload);
                }

                /****************************************************************
                 *
                 * IMPORTANT NOTE:
                 *
                 * This is legacy from the services and design we built ngAutobahn for and
                 * should be removed as soon as we refactor it ( Sorry about that :( ).
                 *
                 * The idea is to expose a facade with publish and subscribe only
                 * so that the channel is hidden and lives as a private variable of the Broker.
                 *
                 ***************************************************************/
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
                        callHandlers(messageName, messagePayload);
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

    /*****************************************************************************/

})(angular);
