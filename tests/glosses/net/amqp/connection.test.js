import {
    succeed,
    fail,
    latch,
    completes,
    kCallback,
    OPEN_OPTS,
    connectionHandshake,
    socketPair,
    runServer
} from "./support";

const {
    std: { assert }
} = adone;

const {
    frame: {
        HEARTBEAT,
        HB_BUF
    },
    connect: { Connection },
    defs
} = adone.private(adone.net.amqp);

const LOG_ERRORS = process.env.LOG_ERRORS;

const connectionTest = (client, server) => {
    return function (done) {
        const bothDone = latch(2, done);
        const pair = socketPair();
        const c = new Connection(pair.client);
        if (LOG_ERRORS) {
            c.on("error", console.warn);
        }
        client(c, bothDone);

        // NB only not a race here because the writes are synchronous
        const protocolHeader = pair.server.read(8);
        assert.deepEqual(Buffer.from(`AMQP${String.fromCharCode(0, 0, 9, 1)}`),
            protocolHeader);

        const s = runServer(pair.server, (send, wait) => {
            server(send, wait, bothDone, pair.server);
        });
    };
};
describe("net", "amqp", () => {
    describe("Connection errors", () => {

        it("socket close during open", (done) => {
        // RabbitMQ itself will take at least 3 seconds to close the socket
        // in the event of a handshake problem. Instead of using a live
        // connection, I'm just going to pretend.
            const pair = socketPair();
            const conn = new Connection(pair.client);
            pair.server.on("readable", () => {
                pair.server.end();
            });
            conn.open({}, kCallback(fail(done), succeed(done)));
        });

        it("bad frame during open", (done) => {
            const ss = socketPair();
            const conn = new Connection(ss.client);
            ss.server.on("readable", () => {
                ss.server.write(Buffer.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]));
            });
            conn.open({}, kCallback(fail(done), succeed(done)));
        });

    });

    describe("Connection open", () => {

        it("happy", connectionTest(
            (c, done) => {
                c.open(OPEN_OPTS, kCallback(succeed(done), fail(done)));
            },
            (send, wait, done) => {
                connectionHandshake(send, wait).then(succeed(done), fail(done));
            }));

        it("wrong first frame", connectionTest(
            (c, done) => {
                c.open(OPEN_OPTS, kCallback(fail(done), succeed(done)));
            },
            (send, wait, done) => {
                // bad server! bad! whatever were you thinking?
                completes(() => {
                    send(defs.ConnectionTune,
                        { channelMax: 0,
                            heartbeat: 0,
                            frameMax: 0 });
                }, done);
            }));

        it("unexpected socket close", connectionTest(
            (c, done) => {
                c.open(OPEN_OPTS, kCallback(fail(done), succeed(done)));
            },
            (send, wait, done, socket) => {
                send(defs.ConnectionStart,
                    { versionMajor: 0,
                        versionMinor: 9,
                        serverProperties: {},
                        mechanisms: Buffer.from("PLAIN"),
                        locales: Buffer.from("en_US") });
                return wait(defs.ConnectionStartOk)()
                    .then(() => {
                        socket.end();
                    })
                    .then(succeed(done), fail(done));
            }));

    });

    describe("Connection running", () => {

        it("wrong frame on channel 0", connectionTest(
            (c, done) => {
                c.on("error", succeed(done));
                c.open(OPEN_OPTS);
            },
            (send, wait, done) => {
                connectionHandshake(send, wait)
                    .then(() => {
                        // there's actually nothing that would plausibly be sent to a
                        // just opened connection, so this is violating more than one
                        // rule. Nonetheless.
                        send(defs.ChannelOpenOk, { channelId: Buffer.from("") }, 0);
                    })
                    .then(wait(defs.ConnectionClose))
                    .then((close) => {
                        send(defs.ConnectionCloseOk, {}, 0);
                    }).then(succeed(done), fail(done));
            }));

        it("unopened channel", connectionTest(
            (c, done) => {
                c.on("error", succeed(done));
                c.open(OPEN_OPTS);
            },
            (send, wait, done) => {
                connectionHandshake(send, wait)
                    .then(() => {
                        // there's actually nothing that would plausibly be sent to a
                        // just opened connection, so this is violating more than one
                        // rule. Nonetheless.
                        send(defs.ChannelOpenOk, { channelId: Buffer.from("") }, 3);
                    })
                    .then(wait(defs.ConnectionClose))
                    .then((close) => {
                        send(defs.ConnectionCloseOk, {}, 0);
                    }).then(succeed(done), fail(done));
            }));

        it("unexpected socket close", connectionTest(
            (c, done) => {
                const errorAndClosed = latch(2, done);
                c.on("error", succeed(errorAndClosed));
                c.on("close", succeed(errorAndClosed));
                c.open(OPEN_OPTS, kCallback(() => {
                    c.sendHeartbeat();
                }, fail(errorAndClosed)));
            },
            (send, wait, done, socket) => {
                connectionHandshake(send, wait)
                    .then(wait())
                    .then(() => {
                        socket.end();
                    }).then(succeed(done));
            }));

        it("connection.blocked", connectionTest(
            (c, done) => {
                c.on("blocked", succeed(done));
                c.open(OPEN_OPTS);
            },
            (send, wait, done, socket) => {
                connectionHandshake(send, wait)
                    .then(() => {
                        send(defs.ConnectionBlocked, { reason: "felt like it" }, 0);
                    })
                    .then(succeed(done));
            }));

        it("connection.unblocked", connectionTest(
            (c, done) => {
                c.on("unblocked", succeed(done));
                c.open(OPEN_OPTS);
            },
            (send, wait, done, socket) => {
                connectionHandshake(send, wait)
                    .then(() => {
                        send(defs.ConnectionUnblocked, {}, 0);
                    })
                    .then(succeed(done));
            }));


    });

    describe("Connection close", () => {
        it("happy", connectionTest(
            (c, done0) => {
                const done = latch(2, done0);
                c.on("close", done);
                c.open(OPEN_OPTS, kCallback((_ok) => {
                    c.close(kCallback(succeed(done), fail(done)));
                }, () => {}));
            },
            (send, wait, done) => {
                connectionHandshake(send, wait)
                    .then(wait(defs.ConnectionClose))
                    .then((close) => {
                        send(defs.ConnectionCloseOk, {});
                    })
                    .then(succeed(done), fail(done));
            }));

        it("interleaved close frames", connectionTest(
            (c, done0) => {
                const done = latch(2, done0);
                c.on("close", done);
                c.open(OPEN_OPTS, kCallback((_ok) => {
                    c.close(kCallback(succeed(done), fail(done)));
                }, done));
            },
            (send, wait, done) => {
                connectionHandshake(send, wait)
                    .then(wait(defs.ConnectionClose))
                    .then((f) => {
                        send(defs.ConnectionClose, {
                            replyText: "Ha!",
                            replyCode: defs.constants.REPLY_SUCCESS,
                            methodId: 0, classId: 0
                        });
                    })
                    .then(wait(defs.ConnectionCloseOk))
                    .then((f) => {
                        send(defs.ConnectionCloseOk, {});
                    })
                    .then(succeed(done), fail(done));
            }));

        it("server error close", connectionTest(
            (c, done0) => {
                const done = latch(2, done0);
                c.on("close", succeed(done));
                c.on("error", succeed(done));
                c.open(OPEN_OPTS);
            },
            (send, wait, done) => {
                connectionHandshake(send, wait)
                    .then((f) => {
                        send(defs.ConnectionClose, {
                            replyText: "Begone",
                            replyCode: defs.constants.INTERNAL_ERROR,
                            methodId: 0, classId: 0
                        });
                    })
                    .then(wait(defs.ConnectionCloseOk))
                    .then(succeed(done), fail(done));
            }));

        it("operator-intiated close", connectionTest(
            (c, done) => {
                c.on("close", succeed(done));
                c.on("error", fail(done));
                c.open(OPEN_OPTS);
            },
            (send, wait, done) => {
                connectionHandshake(send, wait)
                    .then((f) => {
                        send(defs.ConnectionClose, {
                            replyText: "Begone",
                            replyCode: defs.constants.CONNECTION_FORCED,
                            methodId: 0, classId: 0
                        });
                    })
                    .then(wait(defs.ConnectionCloseOk))
                    .then(succeed(done), fail(done));
            }));


        it("double close", connectionTest(
            (c, done) => {
                c.open(OPEN_OPTS, kCallback(() => {
                    c.close();
                    // NB no synchronisation, we do this straight away
                    assert.throws(() => {
                        c.close();
                    });
                    done();
                }, done));
            },
            (send, wait, done) => {
                connectionHandshake(send, wait)
                    .then(wait(defs.ConnectionClose))
                    .then(() => {
                        send(defs.ConnectionCloseOk, {});
                    })
                    .then(succeed(done), fail(done));
            }));

    });

    describe("heartbeats", () => {

        const heartbeat = adone.private(adone.net.amqp).heartbeat;

        before(() => {
            heartbeat.UNITS_TO_MS = 20;
        });

        after(() => {
            heartbeat.UNITS_TO_MS = 1000;
        });

        it("send heartbeat after open", connectionTest(
            (c, done) => {
                completes(() => {
                    const opts = Object.create(OPEN_OPTS);
                    opts.heartbeat = 1;
                    // Don't leave the error waiting to happen for the next test, this
                    // confuses mocha awfully
                    c.on("error", () => {});
                    c.open(opts);
                }, done);
            },
            (send, wait, done, socket) => {
                let timer;
                connectionHandshake(send, wait)
                    .then(() => {
                        timer = setInterval(() => {
                            socket.write(HB_BUF);
                        }, heartbeat.UNITS_TO_MS);
                    })
                    .then(wait())
                    .then((hb) => {
                        if (hb === HEARTBEAT) {
                            done();
                        } else {
                            done("Next frame after silence not a heartbeat");
                        }
                        clearInterval(timer);
                    });
            }));

        it("detect lack of heartbeats", connectionTest(
            (c, done) => {
                const opts = Object.create(OPEN_OPTS);
                opts.heartbeat = 1;
                c.on("error", succeed(done));
                c.open(opts);
            },
            (send, wait, done, socket) => {
                connectionHandshake(send, wait)
                    .then(succeed(done), fail(done));
                // conspicuously not sending anything ...
            }));

    });
});
