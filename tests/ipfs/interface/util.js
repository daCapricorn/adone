const {
    p2p: { crypto },
    ipfs: { isIPFS }
} = adone;

const { getDescribe, getIt } = require("./utils/shani");

module.exports = (createCommon, options) => {
    const describe = getDescribe(options);
    const it = getIt(options);
    const common = createCommon();

    describe(".util", () => {
        let ipfs;

        before(function (done) {
            // CI takes longer to instantiate the daemon, so we need to increase the
            // timeout for the before step
            this.timeout(60 * 1000);

            common.setup((err, factory) => {
                expect(err).to.not.exist();
                factory.spawnNode((err, node) => {
                    expect(err).to.not.exist();
                    ipfs = node;
                    done();
                });
            });
        });

        after((done) => common.teardown(done));

        it("should have a util object with the required values", () => {
            expect(ipfs.util).to.be.deep.equal({
                crypto,
                isIPFS
            });
        });
    });
};
