const MemoryStore = require("interface-datastore").MemoryDatastore;

const {
    p2p: { Multiplex, WebsocketStar, KadDHT, secio: SECIO, Node, PeerInfo, PeerBook }
} = adone;

const libp2pComponent = require(adone.std.path.join(adone.ROOT_PATH, "lib/ipfs/main/core/components/libp2p"));

describe("libp2p customization", function () {
    // Provide some extra time for ci since we're starting libp2p nodes in each test
    this.timeout(25 * 1000);

    let datastore;
    let peerInfo;
    let peerBook;
    let testConfig;
    let _libp2p;

    before(function (done) {
        this.timeout(25 * 1000);

        testConfig = {
            Addresses: {
                Swarm: ["/ip4/0.0.0.0/tcp/4002"],
                API: "/ip4/127.0.0.1/tcp/5002",
                Gateway: "/ip4/127.0.0.1/tcp/9090"
            },
            Discovery: {
                MDNS: {
                    Enabled: false
                },
                webRTCStar: {
                    Enabled: false
                }
            },
            EXPERIMENTAL: {
                pubsub: false
            }
        };
        datastore = new MemoryStore();
        peerBook = new PeerBook();
        PeerInfo.create((err, pi) => {
            peerInfo = pi;
            done(err);
        });
    });

    afterEach((done) => {
        if (!_libp2p) {
            return done();
        }

        _libp2p.stop(() => {
            _libp2p = null;
            done();
        });
    });

    describe("bundle", () => {
        it("should allow for using a libp2p bundle", (done) => {
            const ipfs = {
                _repo: {
                    datastore
                },
                _peerInfo: peerInfo,
                _peerBook: peerBook,
                _print: console.log,
                _options: {
                    libp2p: (opts) => {
                        const wsstar = new WebsocketStar({ id: opts.peerInfo.id });

                        return new Node({
                            peerInfo: opts.peerInfo,
                            peerBook: opts.peerBook,
                            modules: {
                                transport: [
                                    wsstar
                                ],
                                streamMuxer: [
                                    Multiplex
                                ],
                                connEncryption: [
                                    SECIO
                                ],
                                peerDiscovery: [
                                    wsstar.discovery
                                ],
                                dht: KadDHT
                            }
                        });
                    }
                }
            };

            _libp2p = libp2pComponent(ipfs, testConfig);

            _libp2p.start((err) => {
                expect(err).to.not.exist();
                expect(_libp2p._config).to.not.have.property("peerDiscovery");
                expect(_libp2p._transport).to.have.length(1);
                done();
            });
        });
    });

    describe("options", () => {
        it("should use options by default", (done) => {
            const ipfs = {
                _repo: {
                    datastore
                },
                _peerInfo: peerInfo,
                _peerBook: peerBook,
                _print: console.log
            };

            _libp2p = libp2pComponent(ipfs, testConfig);

            _libp2p.start((err) => {
                expect(err).to.not.exist();
                expect(_libp2p._config).to.deep.include({
                    peerDiscovery: {
                        bootstrap: {
                            enabled: true,
                            list: []
                        },
                        mdns: {
                            enabled: false
                        },
                        webRTCStar: {
                            enabled: false
                        },
                        websocketStar: {
                            enabled: true
                        }
                    },
                    EXPERIMENTAL: {
                        pubsub: false
                    }
                });
                expect(_libp2p._transport).to.have.length(3);
                done();
            });
        });

        it("should allow for overriding via options", (done) => {
            const wsstar = new WebsocketStar({ id: peerInfo.id });

            const ipfs = {
                _repo: {
                    datastore
                },
                _peerInfo: peerInfo,
                _peerBook: peerBook,
                _print: console.log,
                _options: {
                    config: {
                        Discovery: {
                            MDNS: {
                                Enabled: true
                            }
                        }
                    },
                    EXPERIMENTAL: {
                        pubsub: true
                    },
                    libp2p: {
                        modules: {
                            transport: [
                                wsstar
                            ],
                            peerDiscovery: [
                                wsstar.discovery
                            ]
                        }
                    }
                }
            };

            _libp2p = libp2pComponent(ipfs, testConfig);

            _libp2p.start((err) => {
                expect(err).to.not.exist();
                expect(_libp2p._config).to.deep.include({
                    peerDiscovery: {
                        bootstrap: {
                            enabled: true,
                            list: []
                        },
                        mdns: {
                            enabled: true
                        },
                        webRTCStar: {
                            enabled: false
                        },
                        websocketStar: {
                            enabled: true
                        }
                    },
                    EXPERIMENTAL: {
                        pubsub: true
                    }
                });
                expect(_libp2p._transport).to.have.length(1);
                done();
            });
        });
    });
});