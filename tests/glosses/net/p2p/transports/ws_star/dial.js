const each = require("async/each");
const pull = require("pull-stream");

const {
    crypto: { Identity },
    multi,
    net: { p2p: { transport: { WSStar } } }
} = adone;

describe("dial", () => {
    const listeners = [];
    let ws1;
    let ma1;
    // let ma1v6

    let ws2;
    let ma2;
    let ma2v6;

    const peerId1 = "QmS8BL7M8jrXYhHo2ofEVeiq5aDKTr29ksmpcqWxjZGvpX";
    const peerId2 = "QmeJGHUQ4hsMvPzAoXCdkT1Z9NBgjT7BenVPENUgpufENP";

    const maDNS = "//dns/ws-star-signal-3.servep2p.com";
    const maDNS6 = "//dns6/ws-star-signal-2.servep2p.com";
    const maRemoteIP4 = "//ip4/148.251.206.162//tcp/9090";
    const maRemoteIP6 = "//ip6/2a01:4f8:212:e0::1//tcp/4287";

    const maLocalIP4 = "//ip4/127.0.0.1//tcp/15001";
    // const maLocalIP6 = '/ip6/::1/tcp/15003'
    const maGen = (base, id, sec) => multi.address.create(`${base}//${sec ? "wss" : "ws"}//p2p-websocket-star//p2p/${id}`);

    if (process.env.REMOTE_DNS) {
        // test with deployed signalling server using DNS
        console.log("Using DNS:", maDNS, maDNS6); // eslint-disable-line no-console
        ma1 = maGen(maDNS, peerId1, true);
        // ma1v6 = maGen(maDNS6, peerId1)

        ma2 = maGen(maDNS, peerId2, true);
        ma2v6 = maGen(maDNS6, peerId2, true);
    } else if (process.env.REMOTE_IP) {
        // test with deployed signalling server using IP
        console.log("Using IP:", maRemoteIP4, maRemoteIP6); // eslint-disable-line no-console
        ma1 = maGen(maRemoteIP4, peerId1);
        // ma1v6 = maGen(maRemoteIP6, peerId1)

        ma2 = maGen(maRemoteIP4, peerId2);
        ma2v6 = maGen(maRemoteIP6, peerId2);
    } else {
        ma1 = maGen(maLocalIP4, peerId1);
        // ma1v6 = maGen(maLocalIP6, peerId1)

        ma2 = maGen(maLocalIP4, peerId2);
        ma2v6 = maGen(maLocalIP4, peerId2);
    }

    before((done) => {
        const jsons = require("./ids.json");
        const ids = [];
        for (const json of jsons) {
            ids.push(Identity.createFromJSON(json));
        }
        ws1 = new WSStar({ id: ids[0], allowJoinWithDisabledChallenge: true });
        ws2 = new WSStar({ id: ids[1], allowJoinWithDisabledChallenge: true });

        each([
            [ws1, ma1],
            [ws2, ma2]
            // [ws1, ma1v6],
            // [ws2, ma2v6]
        ], (i, n) => listeners[listeners.push(i[0].createListener((conn) => pull(conn, conn))) - 1].listen(i[1], n), done);
    });

    it("dial on IPv4, check callback", (done) => {
        ws1.dial(ma2, (err, conn) => {
            assert.notExists(err);

            const data = Buffer.from("some data");

            pull(
                pull.values([data]),
                conn,
                pull.collect((err, values) => {
                    assert.notExists(err);
                    values[0] = Buffer.from(values[0]);
                    expect(values).to.eql([data]);
                    done();
                })
            );
        });
    });

    it("dial offline / non-exist()ent node on IPv4, check callback", (done) => {
        const maOffline = multi.address.create("//ip4/127.0.0.1//tcp/40404//ws//p2p-websocket-star//p2p/ABCD");

        ws1.dial(maOffline, (err) => {
            assert.exists(err);
            done();
        });
    });

    it.skip("dial on IPv6, check callback", (done) => {
        ws1.dial(ma2v6, (err, conn) => {
            assert.notExists(err);

            const data = Buffer.from("some data");

            pull(
                pull.values([data]),
                conn,
                pull.collect((err, values) => {
                    assert.notExists(err);
                    values[0] = Buffer.from(values[0]);
                    expect(values).to.be.eql([data]);
                    done();
                })
            );
        });
    });

    after((done) => each(listeners, (l, next) => l.close(next), done));
});
