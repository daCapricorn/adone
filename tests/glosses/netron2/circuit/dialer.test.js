const nodes = require("./fixtures/nodes");

const {
    multi,
    netron2: { PeerId, PeerInfo, Connection },
    stream: { pull }
} = adone;

const { CircuitDialer, StreamHandler, protocol, utils } = adone.private(adone.netron2.circuit);

describe("netron", "circuit", "dialer", () => {
    describe(".dial", () => {
        const dialer = stub.createStubInstance(CircuitDialer);

        beforeEach(() => {
            dialer.relayPeers = new Map();
            dialer.relayPeers.set(nodes.node2.id, new Connection());
            dialer.relayPeers.set(nodes.node3.id, new Connection());
            dialer.dial.callThrough();
        });

        afterEach(() => {
            dialer._dialPeer.reset();
        });

        it("fail on non circuit addr", () => {
            const dstMa = multi.address.create(`/ipfs/${nodes.node4.id}`);
            expect(() => dialer.dial(dstMa, (err) => {
                err.to.match(/invalid circuit address/);
            }));
        });

        it("dial a peer", (done) => {
            const dstMa = multi.address.create(`/p2p-circuit/ipfs/${nodes.node3.id}`);
            dialer._dialPeer.callsFake((dstMa, relay, callback) => {
                return callback(null, dialer.relayPeers.get(nodes.node3.id));
            });

            dialer.dial(dstMa, (err, conn) => {
                assert.notExists(err);
                assert.instanceOf(conn, Connection);
                done();
            });
        });

        it("dial a peer over the specified relay", (done) => {
            const dstMa = multi.address.create(`/ipfs/${nodes.node3.id}/p2p-circuit/ipfs/${nodes.node4.id}`);
            dialer._dialPeer.callsFake((dstMa, relay, callback) => {
                expect(relay.toString()).to.equal(`/ipfs/${nodes.node3.id}`);
                return callback(null, new Connection());
            });

            dialer.dial(dstMa, (err, conn) => {
                assert.notExists(err);
                assert.instanceOf(conn, Connection);
                done();
            });
        });
    });

    describe(".canHop", () => {
        const dialer = stub.createStubInstance(CircuitDialer);

        let stream = null;
        let shake = null;
        let fromConn = null;
        const peer = new PeerInfo(PeerId.createFromBase58("QmQWqGdndSpAkxfk8iyiJyz3XXGkrDNujvc8vEst3baubA"));

        beforeEach(() => {
            stream = pull.handshake({ timeout: 1000 * 60 });
            shake = stream.handshake;
            fromConn = new Connection(stream);

            dialer.relayPeers = new Map();
            dialer.utils = utils({});
            dialer.canHop.callThrough();
        });

        afterEach(() => {
            dialer._dialRelay.reset();
        });

        it("should handle successful CAN_HOP", () => {
            pull(
                pull.values([protocol.CircuitRelay.encode({
                    type: protocol.CircuitRelay.type.HOP,
                    code: protocol.CircuitRelay.Status.SUCCESS
                })]),
                pull.lengthPrefixed.encode(),
                pull.collect((err, encoded) => {
                    assert.notExists(err);
                    encoded.forEach((e) => shake.write(e));
                    dialer._dialRelay.callsFake((peer, cb) => {
                        cb(null, new StreamHandler(fromConn));
                    });
                })
            );

            dialer.canHop(peer, (err) => {
                assert.notExists(err);
                assert.ok(dialer.relayPeers.has(peer.id.asBase58()));
            });
        });

        it("should handle failed CAN_HOP", () => {
            pull(
                pull.values([protocol.CircuitRelay.encode({
                    type: protocol.CircuitRelay.type.HOP,
                    code: protocol.CircuitRelay.Status.HOP_CANT_SPEAK_RELAY
                })]),
                pull.lengthPrefixed.encode(),
                pull.collect((err, encoded) => {
                    assert.notExists(err);
                    encoded.forEach((e) => shake.write(e));
                    dialer._dialRelay.callsFake((peer, cb) => {
                        cb(null, new StreamHandler(fromConn));
                    });
                })
            );

            dialer.canHop(peer, (err) => {
                assert.notExists(err);
                assert.notOk(dialer.relayPeers.has(peer.id.asBase58()));
            });
        });
    });

    describe("._dialPeer", () => {
        const dialer = stub.createStubInstance(CircuitDialer);

        beforeEach(() => {
            dialer.relayPeers = new Map();
            dialer.relayPeers.set(nodes.node1.id, new Connection());
            dialer.relayPeers.set(nodes.node2.id, new Connection());
            dialer.relayPeers.set(nodes.node3.id, new Connection());
            dialer._dialPeer.callThrough();
        });

        afterEach(() => {
            dialer._negotiateRelay.reset();
        });

        it("should dial a peer over any relay", (done) => {
            const dstMa = multi.address.create(`/ipfs/${nodes.node4.id}`);
            dialer._negotiateRelay.callsFake((conn, dstMa, callback) => {
                if (conn === dialer.relayPeers.get(nodes.node3.id)) {
                    return callback(null, dialer.relayPeers.get(nodes.node3.id));
                }

                callback(new Error("error"));
            });

            dialer._dialPeer(dstMa, (err, conn) => {
                assert.notExists(err);
                expect(conn).to.be.an.instanceOf(Connection);
                expect(conn).to.deep.equal(dialer.relayPeers.get(nodes.node3.id));
                done();
            });
        });

        it("should fail dialing a peer over any relay", (done) => {
            const dstMa = multi.address.create(`/ipfs/${nodes.node4.id}`);
            dialer._negotiateRelay.callsFake((conn, dstMa, callback) => {
                callback(new Error("error"));
            });

            dialer._dialPeer(dstMa, (err, conn) => {
                assert.undefined(conn);
                assert.notNull(err);
                expect(err).to.equal("no relay peers were found or all relays failed to dial");
                done();
            });
        });
    });

    describe("._negotiateRelay", () => {
        const dialer = stub.createStubInstance(CircuitDialer);
        const dstMa = multi.address.create(`/ipfs/${nodes.node4.id}`);

        let conn;
        let stream;
        let shake;
        const callback = stub();

        beforeEach(() => {
            const peerId = PeerId.createFromJSON(nodes.node4);
            const peer = PeerInfo.create(peerId);
            peer.multiaddrs.add("/p2p-circuit/ipfs/QmSswe1dCFRepmhjAMR5VfHeokGLcvVggkuDJm7RMfJSrE");
            dialer.swarm = {
                _peerInfo: peer
            };
            dialer.relayConns = new Map();
            dialer._negotiateRelay.callThrough();
            stream = pull.handshake({ timeout: 1000 * 60 });
            shake = stream.handshake;
            conn = new Connection();
            conn.setPeerInfo(new PeerInfo(PeerId.createFromBase58("QmSswe1dCFRepmhjAMR5VfHeokGLcvVggkuDJm7RMfJSrE")));
            conn.setInnerConn(stream);
            dialer._negotiateRelay(conn, dstMa, callback);
        });

        afterEach(() => {
            callback.reset();
        });

        it("should write the correct dst addr", (done) => {
            pull.lengthPrefixed.decodeFromReader(shake, (err, msg) => {
                shake.write(protocol.CircuitRelay.encode({
                    type: protocol.CircuitRelay.Type.STATUS,
                    code: protocol.CircuitRelay.Status.SUCCESS
                }));
                assert.notExists(err);
                expect(protocol.CircuitRelay.decode(msg).dstPeer.addrs[0]).to.deep.equal(dstMa.buffer);
                done();
            });
        });

        it("should handle failed relay negotiation", (done) => {
            callback.callsFake((err, msg) => {
                assert.notNull(err);
                expect(err).to.be.an.instanceOf(Error);
                expect(err.message).to.be.equal("Got 400 error code trying to dial over relay");
                assert.ok(callback.calledOnce);
                done();
            });

            // send failed message
            pull.lengthPrefixed.decodeFromReader(shake, (err, msg) => {
                if (err) {
                    return done(err);
                }

                pull(
                    pull.values([protocol.CircuitRelay.encode({
                        type: protocol.CircuitRelay.Type.STATUS,
                        code: protocol.CircuitRelay.Status.MALFORMED_MESSAGE
                    })]), // send arbitrary non 200 code
                    pull.lengthPrefixed.encode(),
                    pull.collect((err, encoded) => {
                        assert.notExists(err);
                        encoded.forEach((e) => shake.write(e));
                    })
                );
            });
        });
    });
});
