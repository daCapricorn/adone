const peerIdJSON = require("./peer-test.json");

const {
    multiformat: { mafmt, multiaddr },
    p2p: { PeerId, PeerInfo }
} = adone;

describe("p2p", "PeerInfo", () => {
    let pi;

    beforeEach((done) => {
        PeerId.create({ bits: 512 }, (err, id) => {
            if (err) {
                return done(err);
            }
            pi = new PeerInfo(id);
            done();
        });
    });

    it("create with Id class", (done) => {
        PeerId.create({ bits: 512 }, (err, id) => {
            expect(err).to.not.exist();
            const pi = new PeerInfo(id);
            const pi2 = new PeerInfo(id);
            expect(pi.id).to.exist();
            expect(pi.id).to.eql(id);
            expect(pi2).to.exist();
            expect(pi2.id).to.exist();
            expect(pi2.id).to.eql(id);
            done();
        });
    });

    it("throws when not passing an Id", () => {
        expect(() => new PeerInfo()).to.throw();
    });

    it("isPeerInfo", () => {
        expect(PeerInfo.isPeerInfo(pi)).to.equal(true);
        expect(PeerInfo.isPeerInfo(pi.id)).to.equal(false);
        expect(PeerInfo.isPeerInfo("bananas")).to.equal(false);
    });

    it(".create", function (done) {
        this.timeout(20 * 1000);
        PeerInfo.create((err, pi) => {
            expect(err).to.not.exist();
            expect(pi.id).to.exist();
            done();
        });
    });

    it("create with Id as JSON", (done) => {
        PeerInfo.create(peerIdJSON, (err, pi) => {
            expect(err).to.not.exist();
            expect(pi.id).to.exist();
            expect(pi.id.toJSON()).to.eql(peerIdJSON);
            done();
        });
    });

    it(".create with existing id", (done) => {
        PeerId.create({ bits: 512 }, (err, id) => {
            expect(err).to.not.exist();
            PeerInfo.create(id, (err, pi) => {
                expect(err).to.not.exist();
                expect(pi.id).to.exist();
                expect(pi.id.isEqual(id)).to.equal(true);
                done();
            });
        });
    });

    it("add multiaddr", () => {
        const ma = multiaddr("/ip4/127.0.0.1/tcp/5001");
        pi.multiaddrs.add(ma);
        expect(pi.multiaddrs.size).to.equal(1);
    });

    it("add multiaddr that are buffers", () => {
        const ma = multiaddr("/ip4/127.0.0.1/tcp/5001");
        pi.multiaddrs.add(ma.buffer);
        expect(pi.multiaddrs.has(ma)).to.equal(true);
    });

    it("add repeated multiaddr", () => {
        const ma = multiaddr("/ip4/127.0.0.1/tcp/5001");
        pi.multiaddrs.add(ma);
        expect(pi.multiaddrs.size).to.equal(1);
        pi.multiaddrs.add(ma);
        expect(pi.multiaddrs.size).to.equal(1);
    });

    it("delete multiaddr", () => {
        const ma = multiaddr("/ip4/127.0.0.1/tcp/5001");
        pi.multiaddrs.add(ma);
        expect(pi.multiaddrs.size).to.equal(1);
        pi.multiaddrs.delete(ma);
        expect(pi.multiaddrs.size).to.equal(0);
    });

    it("addSafe - avoid multiaddr explosion", () => {
        const ma = multiaddr("/ip4/127.0.0.1/tcp/5001");
        const ma2 = multiaddr("/ip4/127.0.0.1/tcp/9002");
        const ma3 = multiaddr("/ip4/127.0.0.1/tcp/9009");
        pi.multiaddrs.addSafe(ma);
        expect(pi.multiaddrs.size).to.equal(0);
        pi.multiaddrs.addSafe(ma);
        expect(pi.multiaddrs.size).to.equal(1);
        pi.multiaddrs.addSafe(ma2);
        pi.multiaddrs.addSafe(ma3);
        expect(pi.multiaddrs.size).to.equal(1);
    });

    it("addSafe - multiaddr that are buffers", () => {
        const ma = multiaddr("/ip4/127.0.0.1/tcp/5001");
        pi.multiaddrs.addSafe(ma.buffer);
        pi.multiaddrs.addSafe(ma.buffer);
        expect(pi.multiaddrs.has(ma)).to.equal(true);
    });

    it("replace multiaddr", () => {
        const ma1 = multiaddr("/ip4/127.0.0.1/tcp/5001");
        const ma2 = multiaddr("/ip4/127.0.0.1/tcp/5002");
        const ma3 = multiaddr("/ip4/127.0.0.1/tcp/5003");
        const ma4 = multiaddr("/ip4/127.0.0.1/tcp/5004");
        const ma5 = multiaddr("/ip4/127.0.0.1/tcp/5005");
        const ma6 = multiaddr("/ip4/127.0.0.1/tcp/5006");

        pi.multiaddrs.add(ma1);
        pi.multiaddrs.add(ma2);
        pi.multiaddrs.add(ma3);
        pi.multiaddrs.add(ma4);

        expect(pi.multiaddrs.size).to.equal(4);

        const old = [ma2, ma4];
        const fresh = [ma5, ma6];

        pi.multiaddrs.replace(old, fresh);

        expect(pi.multiaddrs.size).to.equal(4);
    });

    it("replace multiaddr (no arrays)", () => {
        const ma1 = multiaddr("/ip4/127.0.0.1/tcp/5001");
        const ma2 = multiaddr("/ip4/127.0.0.1/tcp/5002");
        const ma3 = multiaddr("/ip4/127.0.0.1/tcp/5003");
        const ma4 = multiaddr("/ip4/127.0.0.1/tcp/5004");
        const ma5 = multiaddr("/ip4/127.0.0.1/tcp/5005");

        pi.multiaddrs.add(ma1);
        pi.multiaddrs.add(ma2);
        pi.multiaddrs.add(ma3);
        pi.multiaddrs.add(ma4);

        expect(pi.multiaddrs.size).to.equal(4);

        const old = ma2;
        const fresh = ma5;

        pi.multiaddrs.replace(old, fresh);

        expect(pi.multiaddrs.size).to.equal(4);
    });

    it("get distinct multiaddr same transport multiple different ports", () => {
        const ma1 = multiaddr("/ip4/127.0.0.1/tcp/5001");
        const ma2 = multiaddr("/ip4/127.0.0.1/tcp/5002");
        const ma3 = multiaddr("/ip4/127.0.0.1/tcp/5003");
        const ma4 = multiaddr("/ip4/127.0.0.1/tcp/5004");

        pi.multiaddrs.add(ma1);
        pi.multiaddrs.add(ma2);
        pi.multiaddrs.add(ma3);
        pi.multiaddrs.add(ma4);

        const distinctMultiaddr = pi.multiaddrs.distinct();
        expect(distinctMultiaddr.length).to.equal(4);
    });

    it("get distinct multiaddr same transport different port", () => {
        const ma1 = multiaddr("/ip4/127.0.0.1/tcp/5001");
        const ma2 = multiaddr("/ip4/127.0.0.1/tcp/5002");

        pi.multiaddrs.add(ma1);
        pi.multiaddrs.add(ma2);

        const multiaddrDistinct = pi.multiaddrs.distinct();
        expect(multiaddrDistinct.length).to.equal(2);
    });

    it("get distinct multiaddr same transport same port", () => {
        const ma1 = multiaddr("/ip4/127.0.0.1/tcp/5001");
        const ma2 = multiaddr("/ip4/127.0.0.1/tcp/5001");

        pi.multiaddrs.add(ma1);
        pi.multiaddrs.add(ma2);

        const multiaddrDistinct = pi.multiaddrs.distinct();
        expect(multiaddrDistinct.length).to.equal(1);
    });

    it("get distinct multiaddr different transport same port", () => {
        const ma1 = multiaddr("/ip4/127.0.0.1/tcp/5001");
        const ma2 = multiaddr("/ip4/127.0.0.1/udp/5001");

        pi.multiaddrs.add(ma1);
        pi.multiaddrs.add(ma2);

        const multiaddrDistinct = pi.multiaddrs.distinct();
        expect(multiaddrDistinct.length).to.equal(2);
    });

    it("get distinct multiaddr different family same port same transport", () => {
        const ma1 = multiaddr("/ip4/127.0.0.1/tcp/5001");
        const ma2 = multiaddr("/ip6/::/tcp/5001");

        pi.multiaddrs.add(ma1);
        pi.multiaddrs.add(ma2);

        const multiaddrDistinct = pi.multiaddrs.distinct();
        expect(multiaddrDistinct.length).to.equal(1);
    });

    it("get distinct multiaddr different family same port multiple transports", () => {
        const ma1 = multiaddr("/ip4/127.0.0.1/tcp/5001");
        const ma2 = multiaddr("/ip6/::/tcp/5001");
        const ma3 = multiaddr("/ip6/::/udp/5002");
        const ma4 = multiaddr("/ip4/127.0.0.1/udp/5002");

        pi.multiaddrs.add(ma1);
        pi.multiaddrs.add(ma2);
        pi.multiaddrs.add(ma3);
        pi.multiaddrs.add(ma4);

        const multiaddrDistinct = pi.multiaddrs.distinct();
        expect(multiaddrDistinct.length).to.equal(2);

        expect(multiaddrDistinct[0].toOptions().family).to.equal("ipv4");
        expect(multiaddrDistinct[1].toOptions().family).to.equal("ipv6");
    });

    it("multiaddrs.has", () => {
        pi.multiaddrs.add("/ip4/127.0.0.1/tcp/5001");
        expect(pi.multiaddrs.has("/ip4/127.0.0.1/tcp/5001")).to.equal(true);
        expect(pi.multiaddrs.has("/ip4/127.0.0.1/tcp/5001/ws")).to.equal(false);
    });

    it("multiaddrs.forEach", () => {
        pi.multiaddrs.add("/ip4/127.0.0.1/tcp/5001");
        pi.multiaddrs.forEach((ma) => {
            expect(pi.multiaddrs.has(ma)).to.equal(true);
        });
    });

    it("multiaddrs.filterBy", () => {
        const ma1 = multiaddr("/ip4/127.0.0.1/tcp/7000");
        const ma2 = multiaddr("/ip4/127.0.0.1/udp/5001");
        pi.multiaddrs.add(ma1);
        pi.multiaddrs.add(ma2);
        const maddrs = pi.multiaddrs.filterBy(mafmt.TCP);
        expect(maddrs.length).to.eq(1);
        expect(maddrs[0].equals(ma1)).to.eq(true);
    });

    it("multiaddrs.toArray", () => {
        pi.multiaddrs.add("/ip4/127.0.0.1/tcp/5001");
        pi.multiaddrs.toArray().forEach((ma) => {
            expect(pi.multiaddrs.has(ma)).to.equal(true);
        });
    });

    it(".connect .disconnect", () => {
        pi.multiaddrs.add("/ip4/127.0.0.1/tcp/5001");
        pi.connect("/ip4/127.0.0.1/tcp/5001");
        expect(pi.isConnected()).to.exist();
        pi.disconnect();
        expect(pi.isConnected()).to.not.exist();
        expect(() => pi.connect("/ip4/127.0.0.1/tcp/5001/ws")).to.throw();
    });

    it("multiaddrs.clear", () => {
        pi.multiaddrs.clear();
        expect(pi.multiaddrs.size).to.equal(0);
    });

    it("add a protocol", () => {
        pi.protocols.add("/multistream-select/0.3.0");
        expect(pi.protocols.size).to.equal(1);
    });

    it("add the same protocol multiple times", () => {
        pi.protocols.add("/multistream-select/0.3.0");
        expect(pi.protocols.size).to.equal(1);
        pi.protocols.add("/multistream-select/0.3.0");
        expect(pi.protocols.size).to.equal(1);
    });

    it("remove a protocol", () => {
        pi.protocols.add("/multistream-select/0.3.0");
        expect(pi.protocols.size).to.equal(1);
        pi.protocols.delete("/multistream-select/0.3.0");
        expect(pi.protocols.size).to.equal(0);
    });
});