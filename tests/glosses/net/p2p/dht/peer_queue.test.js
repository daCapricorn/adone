const {
    crypto: { Identity },
    net: { p2p: { dht } }
} = adone;

const { PeerQueue } = adone.private(dht);

describe("dht", "KadDHT", "PeerQueue", () => {
    it("basics", (done) => {
        const p1 = new Identity(Buffer.from("11140beec7b5ea3f0fdbc95d0dd47f3c5bc275da8a31"));
        const p2 = new Identity(Buffer.from("11140beec7b5ea3f0fdbc95d0dd47f3c5bc275da8a32"));
        const p3 = new Identity(Buffer.from("11140beec7b5ea3f0fdbc95d0dd47f3c5bc275da8a33"));
        const p4 = new Identity(Buffer.from("11140beec7b5ea3f0fdbc95d0dd47f3c5bc275da8a34"));
        const p5 = new Identity(Buffer.from("11140beec7b5ea3f0fdbc95d0dd47f3c5bc275da8a31"));

        const peer = new Identity(Buffer.from("11140beec7b5ea3f0fdbc95d0dd47f3c5bc275da8a31"));

        const pq = PeerQueue.fromPeerId(peer);
        pq.enqueue(p3);
        pq.enqueue(p1);
        pq.enqueue(p2);
        pq.enqueue(p4);
        pq.enqueue(p5);
        pq.enqueue(p1);

        expect([
            pq.dequeue(),
            pq.dequeue(),
            pq.dequeue(),
            pq.dequeue(),
            pq.dequeue(),
            pq.dequeue()
        ].map((m) => m.asBase58())).to.be.eql([
            p1, p1, p1, p4, p3, p2
        ].map((m) => m.asBase58()));

        expect(pq.length).to.be.eql(0);
        done();
    });
});
