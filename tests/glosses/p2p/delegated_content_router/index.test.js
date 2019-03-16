const {
    is,
    p2p: { PeerId, DelegatedContentRouter },
    ipfs: { ipfsdCtl },
    multiformat: { CID }
} = adone;

const async = require("async");

const factory = ipfsdCtl.create({ type: "go" });

const spawnNode = function (boostrap, callback) {
    if (is.function(boostrap)) {
        callback = boostrap;
        boostrap = [];
    }

    factory.spawn({
        // Lock down the nodes so testing can be deterministic
        config: {
            Bootstrap: boostrap,
            Discovery: {
                MDNS: {
                    Enabled: false
                }
            }
        }
    }, (err, node) => {
        if (err) {
            return callback(err);
        }

        node.api.id((err, id) => {
            if (err) {
                return callback(err);
            }

            callback(null, node, id);
        });
    });
};

describe("p2p", "DelegatedContentRouter", function () {
    this.timeout(20 * 1000); // we're spawning daemons, give ci some time

    let selfNode;
    let selfId;
    let delegatedNode;
    let bootstrapNode;
    let bootstrapId;

    before((done) => {
        async.waterfall([
            // Spawn a "Boostrap" node that doesnt connect to anything
            (cb) => spawnNode(cb),
            (ipfsd, id, cb) => {
                bootstrapNode = ipfsd;
                bootstrapId = id;
                cb();
            },
            // Spawn our local node and bootstrap the bootstrapper node
            (cb) => spawnNode(bootstrapId.addresses, cb),
            (ipfsd, id, cb) => {
                selfNode = ipfsd;
                selfId = PeerId.createFromB58String(id.id);
                cb();
            },
            // Spawn the delegate node and bootstrap the bootstrapper node
            (cb) => spawnNode(bootstrapId.addresses, cb),
            (ipfsd, id, cb) => {
                delegatedNode = ipfsd;
                cb();
            }
        ], done);
    });

    after((done) => {
        async.parallel([
            (cb) => selfNode.stop(cb),
            (cb) => delegatedNode.stop(cb),
            (cb) => bootstrapNode.stop(cb)
        ], done);
    });

    describe("create", () => {
        it("should require peerInfo", () => {
            expect(() => new DelegatedContentRouter()).to.throw();
        });

        it("should default to https://ipfs.io as the delegate", () => {
            const router = new DelegatedContentRouter(selfId);

            expect(router.api).to.include({
                "api-path": "/api/v0/",
                protocol: "https",
                port: 443,
                host: "ipfs.io"
            });
        });

        it("should allow for just specifying the host", () => {
            const router = new DelegatedContentRouter(selfId, {
                host: "other.ipfs.io"
            });

            expect(router.api).to.include({
                "api-path": "/api/v0/",
                protocol: "https",
                port: 443,
                host: "other.ipfs.io"
            });
        });

        it("should allow for overriding the api", () => {
            const api = {
                "api-path": "/api/v1/",
                protocol: "http",
                port: 8000,
                host: "localhost"
            };
            const router = new DelegatedContentRouter(selfId, api);

            expect(router.api).to.include(api);
        });
    });

    describe("findProviders", () => {
        it("should be able to find providers through the delegate node", (done) => {
            async.waterfall([
                (cb) => {
                    const opts = delegatedNode.apiAddr.toOptions();
                    const routing = new DelegatedContentRouter(selfId, {
                        protocol: "http",
                        port: opts.port,
                        host: opts.host
                    });
                    const cid = new CID("QmS4ustL54uo8FzR9455qaxZwuMiUhyvMcX9Ba8nUH4uVv");
                    routing.findProviders(cid, cb);
                },
                (providers, cb) => {
                    // We should get our local node and the bootstrap node as providers.
                    // The delegate node is not included, because it is handling the requests
                    expect(providers).to.have.length(2);
                    expect(providers.map((p) => p.id.toB58String())).to.have.members([
                        bootstrapId.id,
                        selfId.toB58String()
                    ]);
                    cb();
                }
            ], done);
        });

        it("should be able to specify a maxTimeout", (done) => {
            async.waterfall([
                (cb) => {
                    const opts = delegatedNode.apiAddr.toOptions();
                    const routing = new DelegatedContentRouter(selfId, {
                        protocol: "http",
                        port: opts.port,
                        host: opts.host
                    });
                    const cid = new CID("QmS4ustL54uo8FzR9455qaxZwuMiUhyvMcX9Ba8nUH4uVv");
                    routing.findProviders(cid, { maxTimeout: 5e3 }, cb);
                },
                (providers, cb) => {
                    // We should get our local node and the bootstrap node as providers.
                    // The delegate node is not included, because it is handling the requests
                    expect(providers).to.have.length(2);
                    expect(providers.map((p) => p.id.toB58String())).to.have.members([
                        bootstrapId.id,
                        selfId.toB58String()
                    ]);
                    cb();
                }
            ], done);
        });
    });

    describe.todo("provide", () => {
        it("should be able to register as a content provider to the delegate node", (done) => {
            let contentRouter;
            let cid;

            async.waterfall([
                (cb) => {
                    const opts = delegatedNode.apiAddr.toOptions();
                    contentRouter = new DelegatedContentRouter(selfId, {
                        protocol: "http",
                        port: opts.port,
                        host: opts.host
                    });

                    // console.log(adone.meta.inspect(selfNode.api));
                    selfNode.api.files.add(Buffer.from(`hello-${Math.random()}`), cb);
                },
                (res, cb) => {
                    cid = new CID(res[0].hash);
                    contentRouter.provide(cid, cb);
                },
                (cb) => {
                    delegatedNode.api.dht.findprovs(cid.toBaseEncodedString(), cb);
                },
                (provs, cb) => {
                    let providers = [];
                    provs.filter((res) => Boolean(res.Responses)).forEach((res) => {
                        providers = providers.concat(res.Responses);
                    });

                    // We are hosting the file, validate we're the provider
                    const res = providers.find((prov) => prov.ID === selfId.toB58String());
                    expect(res.ID).to.equal(selfId.toB58String());

                    cb();
                }
            ], done);
        });
    });
});