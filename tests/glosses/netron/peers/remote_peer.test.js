import testInterface from "./interface";

const {
    p2p: { PeerInfo },
    netron: { Netron }
} = adone;

describe.todo("RemotePeer", () => {
    describe("specific", () => {
        let peerInfo;
        let netron;
        let peer;
    
        before(() => {
        });

        beforeEach(() => {
        });
    });

    class TestInterface {
        constructor() {
            this._reset();
        }

        before() {
            this.peerInfoS = PeerInfo.create();
            this.peerInfoC = PeerInfo.create();
        }

        after() {
        }

        async beforeEach() {
            this.netronS = new Netron(this.peerInfoS, {
                proxyContexts: true
            });
            this.peerS = this.netronS.peer;

            this.netronC = new Netron(this.peerInfoC);
            this.peerC = this.netronC.peer;

            const netCoreS = this.netronS.createNetCore("default", {
                addrs: "//ip4/0.0.0.0//tcp/0"
            });
            this.netronC.createNetCore("default", {
                addrs: "//ip4/0.0.0.0//tcp/0"
            });

            await this.netronS.start();
            this.netron = this.netronS;
            this.peer = await this.netronC.connect("default", netCoreS.peerInfo);

            return [this.netron, this.peer];
        }

        async afterEach() {
            await this.netronS.stop("default");
            this._reset();
        }

        _reset() {
            this.netronC = null;
            this.netronS = null;
            this.peerS = null;
            this.peerC = null;
            this.peer = null;
            this.netron = null;
        }
    }

    testInterface(new TestInterface());
});
