const parallel = require("async/parallel");
const waterfall = require("async/waterfall");

const {
    lodash: _
} = adone;
const srcPath = (...args) => adone.std.path.join(adone.ROOT_PATH, "lib", "glosses", "p2p", "kad_dht", ...args);

const Message = require(srcPath("message"));
const handler = require(srcPath("rpc/handlers/add-provider"));

const createPeerInfo = require("../../utils/create_peer_info");
const createValues = require("../../utils/create_values");
const TestDHT = require("../../utils/test_dht");

describe("rpc - handlers - AddProvider", () => {
    let peers;
    let values;
    let tdht;
    let dht;

    before((done) => {
        parallel([
            (cb) => createPeerInfo(3, cb),
            (cb) => createValues(2, cb)
        ], (err, res) => {
            expect(err).to.not.exist();
            peers = res[0];
            values = res[1];
            done();
        });
    });

    beforeEach((done) => {
        tdht = new TestDHT();

        tdht.spawn(1, (err, dhts) => {
            expect(err).to.not.exist();
            dht = dhts[0];
            done();
        });
    });

    afterEach((done) => {
        tdht.teardown(done);
    });

    describe("invalid messages", () => {
        const tests = [{
            message: new Message(Message.TYPES.ADD_PROVIDER, Buffer.alloc(0), 0),
            error: "ERR_MISSING_KEY"
        }, {
            message: new Message(Message.TYPES.ADD_PROVIDER, Buffer.alloc(0), 0),
            error: "ERR_MISSING_KEY"
        }, {
            message: new Message(Message.TYPES.ADD_PROVIDER, Buffer.from("hello world"), 0),
            error: "ERR_INVALID_CID"
        }];

        tests.forEach((t) => it(t.error.toString(), (done) => {
            handler(dht)(peers[0], t.message, (err) => {
                expect(err).to.exist();
                expect(err.code).to.eql(t.error);
                done();
            });
        }));
    });

    it("ignore providers not from the originator", (done) => {
        const cid = values[0].cid;

        const msg = new Message(Message.TYPES.ADD_PROVIDER, cid.buffer, 0);
        const sender = peers[0];
        sender.multiaddrs.add("/ip4/127.0.0.1/tcp/1234");
        const other = peers[1];
        other.multiaddrs.add("/ip4/127.0.0.1/tcp/2345");
        msg.providerPeers = [
            sender,
            other
        ];

        waterfall([
            (cb) => handler(dht)(sender, msg, cb),
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
            (cb) => handler(dht)(sender, msg, cb),
            (cb) => dht.providers.getProviders(cid, cb),
            (provs, cb) => {
                expect(provs).to.have.length(1);
                expect(provs[0].id).to.eql(sender.id.id);
                expect(dht.peerBook.has(sender.id)).to.equal(false);
                cb();
            }
        ], done);
    });
});