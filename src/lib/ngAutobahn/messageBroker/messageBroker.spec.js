describe('NgAutobahnMessageBroker', function () {
    'use strict';

    var $timeout,
        broker,
        message = 'foo',
        payload = {
            bar: 'baz',
        },
        channel = 'ch1',
        handlers = {
            success: function () {},
            error: function () {},
            messageReceived: function () {},
            publish: function () {},
        };

    beforeEach(module('ngAutobahn.messageBroker'));

    beforeEach(function spyes() {
        spyOn(handlers, 'success').and.callThrough();
        spyOn(handlers, 'error').and.callThrough();
        spyOn(handlers, 'messageReceived').and.callThrough();
        spyOn(handlers, 'publish').and.callThrough();
    });

    beforeEach(inject(function (_$timeout_, NgAutobahnMessageBroker) {
        $timeout = _$timeout_;
        broker = new NgAutobahnMessageBroker(channel, handlers.publish);
    }));

    describe('constructor', function () {
        it('should be a function', inject(function (NgAutobahnMessageBroker) {
            expect(typeof NgAutobahnMessageBroker).toBe('function');
        }));

        it('should return a facade to provide access to pubsub methods', inject(function () {
            expect(typeof broker.facade).toBe('object');
            expect(typeof broker.facade.subscribe).toBe('function');
            expect(typeof broker.facade.publish).toBe('function');
        }));

        it('should return a method to provide an encapsulated way of notifiyng', inject(function () {
            expect(typeof broker.messageReceivedHandler).toBe('function');
        }));
    });

    describe('broker.facade', function () {
        describe('publish', function () {
            it('should invoke the publish method passed when creating the object', inject(function () {
                broker.facade.publish(message, payload);
                expect(handlers.publish).toHaveBeenCalled();
            }));
        });

        describe('subscribe', function () {
            it('should call a subscribed handler when calling messageReceivedHandler', inject(function () {
                broker.facade.subscribe(message, handlers.messageReceived);
                broker.messageReceivedHandler([], {
                    channel: channel,
                    type: message
                });
                $timeout.flush();
                expect(handlers.messageReceived).toHaveBeenCalled();
            }));
        });
        describe('getChannel', function () {
            it('should return the channel name', inject(function () {
                var ch = broker.facade.getChannel();
                expect(ch).toEqual(channel);
            }));
        });

    });

});
