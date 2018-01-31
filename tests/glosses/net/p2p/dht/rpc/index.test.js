const { makePeers } = require("../utils");

const {
    net: { p2p: { Connection, multiplex, dht, swarm: { Swarm }, PeerBook, transport: { TCP } } },
    stream: { pull }
} = adone;
const { KadDHT } = dht;
const { rpc, Message } = adone.private(dht);

describe("dht", "KadDHT", "rpc", () => {
    let peerInfos;

    const makeConnection = function (msg, info, callback) {
        const rawConn = {
            source: pull(
                pull.values([msg.serialize()]),
                pull.lengthPrefixed.encode()
            ),
            sink: pull(
                pull.lengthPrefixed.decode(),
                pull.collect(callback)
            )
        };
        const conn = new Connection(rawConn);
        conn.setPeerInfo(info);
        return conn;
    };

    before(() => {
        peerInfos = makePeers(2);
    });

    describe("protocolHandler", () => {
        it("calls back with the response", (done) => {
            const swarm = new Swarm(peerInfos[0], new PeerBook());
            swarm.tm.add("tcp", new TCP());
            swarm.connection.addStreamMuxer(multiplex);
            swarm.connection.reuse();
            const dht = new KadDHT(swarm, { kBucketSize: 5 });

            dht.peerBook.set(peerInfos[1]);

            const msg = new Message(Message.TYPES.GET_VALUE, Buffer.from("hello"), 5);

            const conn = makeConnection(msg, peerInfos[1], (err, res) => {
                assert.notExists(err);
                expect(res).to.have.length(1);
                const msg = Message.deserialize(res[0]);
                expect(msg).to.have.property("key").eql(Buffer.from("hello"));
                expect(msg).to.have.property("closerPeers").eql([]);

                done();
            });

            rpc(dht)("protocol", conn);
        });
    });
});