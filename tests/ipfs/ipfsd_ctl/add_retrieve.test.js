const {
    ipfs: { IPFS, ipfsdCtl }
} = adone;

const waterfall = require("async/waterfall");

const tests = [
    { type: "go", bits: 1024 },
    { type: "js", bits: 512 },
    { type: "proc", exec: IPFS, bits: 512 }
];

describe("data can be put and fetched", () => {
    tests.forEach((dfOpts) => describe(`${dfOpts.type}`, () => {
        let ipfsd;

        before(function (done) {
            this.timeout(30 * 1000);

            const f = ipfsdCtl.create(dfOpts);

            f.spawn({ initOptions: { bits: dfOpts.bits, profile: "test" } }, (err, _ipfsd) => {
                expect(err).to.not.exist();
                expect(_ipfsd).to.exist();
                expect(_ipfsd.api).to.exist();
                expect(_ipfsd.api).to.have.property("id");

                ipfsd = _ipfsd;
                done();
            });
        });

        after(function (done) {
            this.timeout(20 * 1000);
            ipfsd.stop(done);
        });

        it("put and fetch a block", function (done) {
            this.timeout(20 * 1000);

            const data = Buffer.from("blorb");

            waterfall([
                (cb) => ipfsd.api.block.put(data, cb),
                (block, cb) => {
                    const cidStr = block.cid.toBaseEncodedString();
                    expect(cidStr)
                        .to.eql("QmPv52ekjS75L4JmHpXVeuJ5uX2ecSfSZo88NSyxwA3rAQ");

                    ipfsd.api.block.get(cidStr, cb);
                },
                (block, cb) => {
                    expect(block.data).to.eql(data);
                    cb();
                }
            ], done);
        });
    }));
});
