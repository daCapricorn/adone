const { makePeers } = require("./utils");

const {
    netron2: { multiplex, dht, swarm: { Swarm }, PeerBook, Connection, transport: { TCP } },
    stream: { pull }
} = adone;
const { KadDHT } = dht;
const { Message } = adone.private(dht);

describe("netron2", "dht", "KadDHT", "Network", () => {
    let dht;
    let peerInfos;

    before(async function () {
        this.timeout(10 * 1000);
        peerInfos = makePeers(3);
        const swarm = new Swarm(peerInfos[0], new PeerBook());
        swarm.tm.add("tcp", new TCP());
        swarm.connection.addStreamMuxer(multiplex);
        swarm.connection.reuse();
        dht = new KadDHT(swarm);

        await swarm.listen();
        await new Promise((resolve) => dht.start(resolve));
    });

    after(async function () {
        this.timeout(10 * 1000);

        await new Promise((resolve) => dht.stop(resolve));
        await dht.swarm.close();
    });

    describe("sendRequest", () => {
        it("send and response", (done) => {
            let i = 0;
            const finish = () => {
                if (i++ === 1) {
                    done();
                }
            };

            const msg = new Message(Message.TYPES.PING, Buffer.from("hello"), 0);

            // mock it
            dht.swarm.connect = (peer, protocol) => {
                expect(protocol).to.eql("/ipfs/kad/1.0.0");
                const msg = new Message(Message.TYPES.FIND_NODE, Buffer.from("world"), 0);

                const rawConn = {
                    source: pull(
                        pull.values([msg.serialize()]),
                        pull.lengthPrefixed.encode()
                    ),
                    sink: pull(
                        pull.lengthPrefixed.decode(),
                        pull.collect((err, res) => {
                            assert.notExists(err);
                            expect(Message.deserialize(res[0]).type).to.eql(Message.TYPES.PING);
                            finish();
                        })
                    )
                };
                return Promise.resolve(new Connection(rawConn));
            };

            dht.network.sendRequest(peerInfos[0].id, msg, (err, response) => {
                assert.notExists(err);
                expect(response.type).to.eql(Message.TYPES.FIND_NODE);

                finish();
            });
        });

        it("timeout on no message", (done) => {
            let i = 0;
            const finish = () => {
                if (i++ === 1) {
                    done();
                }
            };

            const msg = new Message(Message.TYPES.PING, Buffer.from("hello"), 0);

            // mock it
            dht.swarm.connect = (peer, protocol) => {
                expect(protocol).to.eql("/ipfs/kad/1.0.0");
                const rawConn = {
                    // hanging
                    source: (end, cb) => { },
                    sink: pull(
                        pull.lengthPrefixed.decode(),
                        pull.collect((err, res) => {
                            assert.notExists(err);
                            expect(Message.deserialize(res[0]).type).to.eql(Message.TYPES.PING);
                            finish();
                        })
                    )
                };
                return Promise.resolve(new Connection(rawConn));
            };

            dht.network.readMessageTimeout = 100;

            dht.network.sendRequest(peerInfos[0].id, msg, (err, response) => {
                assert.exists(err);
                expect(err.message).to.match(/timed out/);

                finish();
            });
        });
    });
});
