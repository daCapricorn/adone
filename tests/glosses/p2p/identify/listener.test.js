const pull = require("pull-stream/pull");
const collect = require("pull-stream/sinks/collect");
const pair = require("pull-pair/duplex");
const lp = require("pull-length-prefixed");
const multiaddr = require("multiaddr");

const {
    p2p: { PeerInfo, identify }
} = adone;

const srcPath = (...args) => adone.std.path.join(adone.ROOT_PATH, "lib", "glosses", "p2p", "identify", ...args);
const msg = require(srcPath("message"));

describe("identify.listener", () => {
    let info;

    beforeEach(function (done) {
        this.timeout(20 * 1000);

        PeerInfo.create((err, _info) => {
            if (err) {
                return done(err);
            }

            info = _info;
            done();
        });
    });

    it("works", (done) => {
        const p = pair();

        info.multiaddrs.add(multiaddr("/ip4/127.0.0.1/tcp/5002"));

        pull(
            p[1],
            lp.decode(),
            collect((err, result) => {
                expect(err).to.not.exist();

                const input = msg.decode(result[0]);
                expect(
                    input
                ).to.be.eql({
                    protocolVersion: "ipfs/0.1.0",
                    agentVersion: "na",
                    publicKey: info.id.pubKey.bytes,
                    listenAddrs: [multiaddr("/ip4/127.0.0.1/tcp/5002").buffer],
                    observedAddr: multiaddr("/ip4/127.0.0.1/tcp/5001").buffer,
                    protocols: []
                });
                done();
            })
        );

        const conn = p[0];
        conn.getObservedAddrs = (cb) => {
            cb(null, [multiaddr("/ip4/127.0.0.1/tcp/5001")]);
        };

        identify.listener(conn, info);
    });
});
