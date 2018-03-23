const waterfall = require("async/waterfall");
import { setupDHT, makePeers, makeValues, teardown } from "../../utils";

const {
    net: { p2p: { dht } },
    lodash: _
} = adone;
const { rpcHandler: { addProvider }, Message } = adone.private(dht);

describe("dht", "KadDHT", "rpc - handlers - AddProvider", () => {
    let peers;
    let values;
    let dht;

    before(() => {
        peers = makePeers(3);
        values = makeValues(2);
    });

    afterEach(() => teardown());

    beforeEach(async () => {
        dht = await setupDHT();
    });

    describe("invalid messages", () => {
        const tests = [{
            message: new Message(Message.TYPES.ADD_PROVIDER, Buffer.alloc(0), 0),
            error: /Missing key/
        }, {
            message: new Message(Message.TYPES.ADD_PROVIDER, Buffer.alloc(0), 0),
            error: /Missing key/
        }, {
            message: new Message(Message.TYPES.ADD_PROVIDER, Buffer.from("hello world"), 0),
            error: /Invalid CID/
        }];

        tests.forEach((t) => it(t.error.toString(), (done) => {
            addProvider(dht)(peers[0], t.message, (err, res) => {
                assert.exists(err);
                expect(err.message).to.match(t.error);
                done();
            });
        }));
    });

    it("ignore providers not from the originator", (done) => {
        const cid = values[0].cid;

        const msg = new Message(Message.TYPES.ADD_PROVIDER, cid.buffer, 0);
        const sender = peers[0];
        sender.multiaddrs.add("//ip4/127.0.0.1//tcp/1234");
        const other = peers[1];
        other.multiaddrs.add("//ip4/127.0.0.1//tcp/2345");
        msg.providerPeers = [
            sender,
            other
        ];

        waterfall([
            (cb) => addProvider(dht)(sender, msg, cb),
            (cb) => dht.providers.getProviders(cid, cb),
            (provs, cb) => {
                expect(provs).to.have.length(1);
                expect(provs[0].id).to.eql(sender.id.id);
                const bookEntry = dht.peerBook.get(sender.id);
                expect(bookEntry.multiaddrs.toArray()).to.eql(
                    sender.multiaddrs.toArray()
                );
                cb();
            }
        ], done);
    });

    it("ignore providers with no multiaddrs", (done) => {
        const cid = values[0].cid;
        const msg = new Message(Message.TYPES.ADD_PROVIDER, cid.buffer, 0);
        const sender = _.cloneDeep(peers[0]);
        sender.multiaddrs.clear();
        msg.providerPeers = [sender];

        waterfall([
            (cb) => addProvider(dht)(sender, msg, cb),
            (cb) => dht.providers.getProviders(cid, cb),
            (provs, cb) => {
                expect(provs).to.have.length(1);
                expect(provs[0].id).to.eql(sender.id.id);
                expect(
                    dht.peerBook.has(sender.id)
                ).to.be.eql(false);
                cb();
            }
        ], done);
    });
});
