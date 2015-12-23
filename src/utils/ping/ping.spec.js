describe('ngAutobahn.utils.ping', function () {
    /*it('should be invoked as soon as the connection is established', function () {
        var spy = autobahn.Session.prototype.call;

        socketConnection.openConnection();
        $timeout.flush();

        expect(spy).toHaveBeenCalledWith('ping');
    });

    it('should be invoked 4 times using the default configuration', function () {
        var spy = autobahn.Session.prototype.call;

        socketConnection.openConnection();
        $timeout.flush();
        $interval.flush(5000); // 1 (ping 1st call) + (3 * 1.5s = 4.5s) -> 5s ~ 4 calls

        expect(spy.calls.count()).toEqual(4);
    });

    describe('WHEN exceeding the configured ping.timeout (3s)', function () {
        it('should close the connection', inject(function () {
            var spy = autobahn.Connection.prototype.close;

            socketConnection.openConnection();
            $timeout.flush();
            $interval.flush(5000); // 1 (ping 1st call) + (3 * 1.5s = 4.5s) -> 5s ~ 4 calls
            autobahn.dropConnection();
            $interval.flush(5000); // 1 (ping 1st call) + (3 * 1.5s = 4.5s) -> 5s ~ 4 calls

            expect(spy).toHaveBeenCalled();
        }));

        it('should open the connection after closing it', inject(function () {
            var spy = autobahn.Connection.prototype.open;

            socketConnection.openConnection();
            $timeout.flush();
            $interval.flush(5000); // 1 (ping 1st call) + (3 * 1.5s = 4.5s) -> 5s ~ 4 calls
            autobahn.dropConnection(true);
            $interval.flush(5000); // 1 (ping 1st call) + (3 * 1.5s = 4.5s) -> 5s ~ 4 calls

            expect(spy.calls.count()).toEqual(2);
        }));
    });

    it('should stop after closing the connection on purpose', inject(function () {
        var spy = autobahn.Session.prototype.call;

        socketConnection.openConnection();
        $timeout.flush();
        $interval.flush(5000); // 1 (ping 1st call) + (3 * 1.5s = 4.5s) -> 5s ~ 4 calls
        socketConnection.closeConnection();
        $interval.flush(5000); // 1 (ping 1st call) + (3 * 1.5s = 4.5s) -> 5s ~ 4 calls

        expect(spy.calls.count()).toEqual(4);
    }));*/
});
