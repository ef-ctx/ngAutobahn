describe('ngAutobahnConnectionPing', function () {
    'use strict';

    var connectionPingProvider,
        connectionPing,
        pingProvider,
        ping,
        config = {
            pingMessage: 'test_ping',
            delay: 42,
            maxResponseDelay: 42000
        };

    beforeEach(module('ngAutobahn.utils.connectionPing',
        function (_ngAutobahnConnectionPingProvider_, _NgAutobahnPingProvider_) {
            connectionPingProvider = _ngAutobahnConnectionPingProvider_;
            pingProvider = _NgAutobahnPingProvider_;
        }));

    beforeEach(inject(function () {
        console.log('pingProvider spy', pingProvider);

        spyOn(pingProvider, 'configure').and.callThrough();
    }));

    describe('configure', function () {

        it('should return the updated configuration', function () {

        });

    });

});
