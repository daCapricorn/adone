const {
    p2p: { PeerBook, Switch }
} = adone;

const sinon = require("sinon");

const srcPath = (...args) => adone.std.path.join(adone.ROOT_PATH, "lib", "glosses", "p2p", "switch", ...args);

const Queue = require(srcPath("dialer/queue"));
const QueueManager = require(srcPath("dialer/queueManager"));

const utils = require("./utils");
const createInfos = utils.createInfos;

describe("dialer", () => {
    let switchA;

    before((done) => createInfos(1, (err, infos) => {
        expect(err).to.not.exist();

        switchA = new Switch(infos[0], new PeerBook());

        done();
    }));

    afterEach(() => {
        sinon.restore();
    });

    describe("queue", () => {
        it("should blacklist forever after 5 blacklists", () => {
            const queue = new Queue("QM", switchA);
            for (let i = 0; i < 4; i++) {
                queue.blacklist();
                expect(queue.blackListed).to.be.a("number");
                expect(queue.blackListed).to.not.eql(Infinity);
            }

            queue.blacklist();
            expect(queue.blackListed).to.eql(Infinity);
        });
    });

    describe("queue manager", () => {
        let queueManager;
        before(() => {
            queueManager = new QueueManager(switchA);
        });

        it("should abort cold calls when the queue is full", (done) => {
            sinon.stub(queueManager._coldCallQueue, "size").value(switchA.dialer.MAX_COLD_CALLS);
            const dialRequest = {
                peerInfo: {
                    id: { toB58String: () => "QmA" }
                },
                protocol: null,
                useFSM: true,
                callback: (err) => {
                    expect(err.code).to.eql("DIAL_ABORTED");
                    done();
                }
            };

            queueManager.add(dialRequest);
        });

        it("should add a protocol dial to the normal queue", () => {
            const dialRequest = {
                peerInfo: {
                    id: { toB58String: () => "QmA" },
                    isConnected: () => null
                },
                protocol: "/echo/1.0.0",
                useFSM: true,
                callback: () => { }
            };

            const runSpy = sinon.stub(queueManager, "run");
            const addSpy = sinon.stub(queueManager._queue, "add");
            const deleteSpy = sinon.stub(queueManager._coldCallQueue, "delete");

            queueManager.add(dialRequest);

            expect(runSpy.called).to.eql(true);
            expect(addSpy.called).to.eql(true);
            expect(addSpy.getCall(0).args[0]).to.eql("QmA");
            expect(deleteSpy.called).to.eql(true);
            expect(deleteSpy.getCall(0).args[0]).to.eql("QmA");
        });

        it("should add a cold call to the cold call queue", () => {
            const dialRequest = {
                peerInfo: {
                    id: { toB58String: () => "QmA" },
                    isConnected: () => null
                },
                protocol: null,
                useFSM: true,
                callback: () => { }
            };

            const runSpy = sinon.stub(queueManager, "run");
            const addSpy = sinon.stub(queueManager._coldCallQueue, "add");

            queueManager.add(dialRequest);

            expect(runSpy.called).to.eql(true);
            expect(addSpy.called).to.eql(true);
            expect(addSpy.getCall(0).args[0]).to.eql("QmA");
        });

        it("should abort a cold call if it's in the normal queue", (done) => {
            const dialRequest = {
                peerInfo: {
                    id: { toB58String: () => "QmA" },
                    isConnected: () => null
                },
                protocol: null,
                useFSM: true,
                callback: (err) => {
                    expect(runSpy.called).to.eql(false);
                    expect(hasSpy.called).to.eql(true);
                    expect(hasSpy.getCall(0).args[0]).to.eql("QmA");
                    expect(err.code).to.eql("DIAL_ABORTED");
                    done();
                }
            };

            const runSpy = sinon.stub(queueManager, "run");
            const hasSpy = sinon.stub(queueManager._queue, "has").returns(true);

            queueManager.add(dialRequest);
        });

        it("should remove a queue that has reached max blacklist", () => {
            const queue = new Queue("QmA", switchA);
            queue.blackListed = Infinity;

            const abortSpy = sinon.spy(queue, "abort");
            const queueManager = new QueueManager(switchA);
            queueManager._queues[queue.id] = queue;

            queueManager._clean();

            expect(abortSpy.called).to.eql(true);
            expect(queueManager._queues).to.eql({});
        });

        it("should not remove a queue that is blacklisted below max", () => {
            const queue = new Queue("QmA", switchA);
            queue.blackListed = Date.now() + 10e3;

            const abortSpy = sinon.spy(queue, "abort");
            const queueManager = new QueueManager(switchA);
            queueManager._queues[queue.id] = queue;

            queueManager._clean();

            expect(abortSpy.called).to.eql(false);
            expect(queueManager._queues).to.eql({
                QmA: queue
            });
        });

        it("should remove a queue that is not running and the peer is not connected", () => {
            const disconnectedPeer = {
                id: { toB58String: () => "QmA" },
                isConnected: () => null
            };
            const queue = new Queue(disconnectedPeer.id.toB58String(), switchA);

            const abortSpy = sinon.spy(queue, "abort");
            const queueManager = new QueueManager(switchA);
            queueManager._queues[queue.id] = queue;

            queueManager._clean();

            expect(abortSpy.called).to.eql(true);
            expect(queueManager._queues).to.eql({});
        });

        it("should not remove a queue that is not running but the peer is connected", () => {
            const connectedPeer = {
                id: { toB58String: () => "QmA" },
                isConnected: () => true
            };
            const queue = new Queue(connectedPeer.id.toB58String(), switchA);

            switchA._peerBook.put(connectedPeer);

            const abortSpy = sinon.spy(queue, "abort");
            const queueManager = new QueueManager(switchA);
            queueManager._queues[queue.id] = queue;

            queueManager._clean();

            expect(abortSpy.called).to.eql(false);
            expect(queueManager._queues).to.eql({
                QmA: queue
            });
        });
    });
});