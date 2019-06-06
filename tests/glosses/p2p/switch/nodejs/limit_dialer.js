const utils = require("../utils");

const {
    async: { setImmediate },
    multiformat: { multiaddr },
    stream: { pull }
} = adone;

const srcPath = (...args) => adone.getPath("lib", "glosses", "p2p", "switch", ...args);
const LimitDialer = require(srcPath("limit-dialer"));

describe("LimitDialer", () => {
    let peers;

    before((done) => {
        utils.createInfos(5, (err, infos) => {
            if (err) {
                return done(err);
            }
            peers = infos;

            peers.forEach((peer, i) => {
                peer.multiaddrs.add(multiaddr(`/ip4/191.0.0.1/tcp/123${i}`));
                peer.multiaddrs.add(multiaddr(`/ip4/192.168.0.1/tcp/923${i}`));
                peer.multiaddrs.add(multiaddr(`/ip4/193.168.0.99/tcp/923${i}`));
            });
            done();
        });
    });

    it("all failing", (done) => {
        const dialer = new LimitDialer(2, 10);
        const error = new Error("fail");
        // mock transport
        const t1 = {
            dial(addr, cb) {
                setTimeout(() => cb(error), 1);
                return {};
            }
        };

        dialer.dialMany(peers[0].id, t1, peers[0].multiaddrs.toArray(), (err, conn) => {
            expect(err).to.exist();
            expect(err).to.eql([error, error, error]);
            expect(conn).to.not.exist();
            done();
        });
    });

    it("two success", (done) => {
        const dialer = new LimitDialer(2, 10);

        // mock transport
        const t1 = {
            dial(addr, cb) {
                const as = addr.toString();
                if (as.match(/191/)) {
                    setImmediate(() => cb(new Error("fail")));
                    return null;
                } else if (as.match(/192/)) {
                    setTimeout(cb, 2);
                    return {
                        source: pull.values([1]),
                        sink: pull.drain()
                    };
                } else if (as.match(/193/)) {
                    setTimeout(cb, 8);
                    return {
                        source: pull.values([2]),
                        sink: pull.drain()
                    };
                }
            }
        };

        dialer.dialMany(peers[0].id, t1, peers[0].multiaddrs.toArray(), (err, success) => {
            const conn = success.conn;
            expect(success.multiaddr.toString()).to.equal("/ip4/192.168.0.1/tcp/9230");
            expect(err).to.not.exist();
            pull(
                conn,
                pull.collect((err, res) => {
                    expect(err).to.not.exist();
                    expect(res).to.be.eql([1]);
                    done();
                })
            );
        });
    });
});
