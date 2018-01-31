import { A } from "./contexts";

const {
    is,
    net: { p2p: { PeerInfo } },
    netron2: { Netron, RemotePeer, Reflection, Stub, Definitions, Reference }
} = adone;

describe("common stuff", () => {
    let peerInfo;
    let netron;

    before(() => {
        peerInfo = PeerInfo.create();
        netron = new Netron(peerInfo);
    });

    describe("predicates", () => {
        it("is.netron2()", () => {
            assert.true(is.netron2(netron));
        });

        it("is.netron2OwnPeer()", () => {
            assert.true(is.netron2Peer(netron.peer));
            assert.true(is.netron2OwnPeer(netron.peer));
        });

        it("is.netron2RemotePeer()", () => {
            const rPeer = new RemotePeer(peerInfo, netron);
            assert.true(is.netron2Peer(rPeer));
            assert.true(is.netron2RemotePeer(rPeer));
        });

        it("is.netron2Context()", () => {
            assert.true(is.netron2Context(new A()));
        });

        it("is.netron2Stub()", () => {
            assert.true(is.netron2Stub(new Stub(netron, Reflection.from(new A()))));
        });

        it("is.netron2Definition()", () => {
            const stub = new Stub(netron, Reflection.from(new A()));
            assert.true(is.netron2Definition(stub.definition));
        });

        it("is.netron2Definitions()", () => {
            assert.true(is.netron2Definitions(new Definitions()));
        });

        it("is.netron2Reference()", () => {
            assert.true(is.netron2Reference(new Reference(1)));
        });
    });
});