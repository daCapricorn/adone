const PerMessageDeflate = adone.net.ws.PerMessageDeflate;
const Extensions = adone.net.ws.exts;

describe("PerMessageDeflate", () => {
    describe("#offer", () => {
        it("should create default params", () => {
            const perMessageDeflate = new PerMessageDeflate();

            assert.deepEqual(
                perMessageDeflate.offer(),
                { client_max_window_bits: true }
            );
        });

        it("should create params from options", () => {
            const perMessageDeflate = new PerMessageDeflate({
                serverNoContextTakeover: true,
                clientNoContextTakeover: true,
                serverMaxWindowBits: 10,
                clientMaxWindowBits: 11
            });

            assert.deepEqual(perMessageDeflate.offer(), {
                server_no_context_takeover: true,
                client_no_context_takeover: true,
                server_max_window_bits: 10,
                client_max_window_bits: 11
            });
        });
    });

    describe("#accept", () => {
        describe("as server", () => {
            it("should accept empty offer", () => {
                const perMessageDeflate = new PerMessageDeflate({}, true);

                assert.deepEqual(perMessageDeflate.accept([{}]), {});
            });

            it("should accept offer", () => {
                const perMessageDeflate = new PerMessageDeflate({}, true);
                const extensions = Extensions.parse(
                    "permessage-deflate; server_no_context_takeover; " +
                    "client_no_context_takeover; server_max_window_bits=10; " +
                    "client_max_window_bits=11"
                );

                assert.deepEqual(perMessageDeflate.accept(extensions["permessage-deflate"]), {
                    server_no_context_takeover: true,
                    client_no_context_takeover: true,
                    server_max_window_bits: 10,
                    client_max_window_bits: 11
                });
            });

            it("should prefer configuration than offer", () => {
                const perMessageDeflate = new PerMessageDeflate({
                    serverNoContextTakeover: true,
                    clientNoContextTakeover: true,
                    serverMaxWindowBits: 12,
                    clientMaxWindowBits: 11
                }, true);
                const extensions = Extensions.parse(
                    "permessage-deflate; server_max_window_bits=14; client_max_window_bits=13"
                );

                assert.deepEqual(perMessageDeflate.accept(extensions["permessage-deflate"]), {
                    server_no_context_takeover: true,
                    client_no_context_takeover: true,
                    server_max_window_bits: 12,
                    client_max_window_bits: 11
                });
            });

            it("should fallback", () => {
                const perMessageDeflate = new PerMessageDeflate({ serverMaxWindowBits: 11 }, true);
                const extensions = Extensions.parse(
                    "permessage-deflate; server_max_window_bits=10, permessage-deflate"
                );

                assert.deepEqual(perMessageDeflate.accept(extensions["permessage-deflate"]), {
                    server_max_window_bits: 11
                });
            });

            it("should throw an error if server_no_context_takeover is unsupported", () => {
                const perMessageDeflate = new PerMessageDeflate({ serverNoContextTakeover: false }, true);
                const extensions = Extensions.parse("permessage-deflate; server_no_context_takeover");

                assert.throws(() => perMessageDeflate.accept(extensions["permessage-deflate"]));
            });

            it("should throw an error if server_max_window_bits is unsupported", () => {
                const perMessageDeflate = new PerMessageDeflate({ serverMaxWindowBits: false }, true);
                const extensions = Extensions.parse("permessage-deflate; server_max_window_bits=10");

                assert.throws(() => perMessageDeflate.accept(extensions["permessage-deflate"]));
            });

            it("should throw an error if server_max_window_bits is less than configuration", () => {
                const perMessageDeflate = new PerMessageDeflate({ serverMaxWindowBits: 11 }, true);
                const extensions = Extensions.parse("permessage-deflate; server_max_window_bits=10");

                assert.throws(() => perMessageDeflate.accept(extensions["permessage-deflate"]));
            });

            it("should throw an error if client_max_window_bits is unsupported on client", () => {
                const perMessageDeflate = new PerMessageDeflate({ clientMaxWindowBits: 10 }, true);
                const extensions = Extensions.parse("permessage-deflate");

                assert.throws(() => perMessageDeflate.accept(extensions["permessage-deflate"]));
            });
        });

        describe("as client", () => {
            it("should accept empty response", () => {
                const perMessageDeflate = new PerMessageDeflate({});

                assert.deepEqual(perMessageDeflate.accept([{}]), {});
            });

            it("should accept response parameter", () => {
                const perMessageDeflate = new PerMessageDeflate({});
                const extensions = Extensions.parse(
                    "permessage-deflate; server_no_context_takeover; " +
                    "client_no_context_takeover; server_max_window_bits=10; " +
                    "client_max_window_bits=11"
                );

                assert.deepEqual(perMessageDeflate.accept(extensions["permessage-deflate"]), {
                    server_no_context_takeover: true,
                    client_no_context_takeover: true,
                    server_max_window_bits: 10,
                    client_max_window_bits: 11
                });
            });

            it("should throw an error if client_no_context_takeover is unsupported", () => {
                const perMessageDeflate = new PerMessageDeflate({ clientNoContextTakeover: false });
                const extensions = Extensions.parse("permessage-deflate; client_no_context_takeover");

                assert.throws(() => perMessageDeflate.accept(extensions["permessage-deflate"]));
            });

            it("should throw an error if client_max_window_bits is unsupported", () => {
                const perMessageDeflate = new PerMessageDeflate({ clientMaxWindowBits: false });
                const extensions = Extensions.parse("permessage-deflate; client_max_window_bits=10");

                assert.throws(() => perMessageDeflate.accept(extensions["permessage-deflate"]));
            });

            it("should throw an error if client_max_window_bits is greater than configuration", () => {
                const perMessageDeflate = new PerMessageDeflate({ clientMaxWindowBits: 10 });
                const extensions = Extensions.parse("permessage-deflate; client_max_window_bits=11");

                assert.throws(() => perMessageDeflate.accept(extensions["permessage-deflate"]));
            });
        });

        describe("validate parameters", () => {
            it("should throw an error if a parameter has multiple values", () => {
                const perMessageDeflate = new PerMessageDeflate();
                const extensions = Extensions.parse(
                    "permessage-deflate; server_no_context_takeover; server_no_context_takeover"
                );

                assert.throws(() => perMessageDeflate.accept(extensions["permessage-deflate"]));
            });

            it("should throw an error if a parameter is undefined", () => {
                const perMessageDeflate = new PerMessageDeflate();
                const extensions = Extensions.parse("permessage-deflate; foo;");

                assert.throws(() => perMessageDeflate.accept(extensions["permessage-deflate"]));
            });

            it("should throw an error if server_no_context_takeover has a value", () => {
                const perMessageDeflate = new PerMessageDeflate();
                const extensions = Extensions.parse("permessage-deflate; server_no_context_takeover=10");

                assert.throws(() => perMessageDeflate.accept(extensions["permessage-deflate"]));
            });

            it("should throw an error if client_no_context_takeover has a value", () => {
                const perMessageDeflate = new PerMessageDeflate();
                const extensions = Extensions.parse("permessage-deflate; client_no_context_takeover=10");

                assert.throws(() => perMessageDeflate.accept(extensions["permessage-deflate"]));
            });

            it("should throw an error if server_max_window_bits has an invalid value", () => {
                const perMessageDeflate = new PerMessageDeflate();
                const extensions = Extensions.parse("permessage-deflate; server_max_window_bits=7");

                assert.throws(() => perMessageDeflate.accept(extensions["permessage-deflate"]));
            });

            it("should throw an error if client_max_window_bits has an invalid value", () => {
                const perMessageDeflate = new PerMessageDeflate();
                const extensions = Extensions.parse("permessage-deflate; client_max_window_bits=16");

                assert.throws(() => perMessageDeflate.accept(extensions["permessage-deflate"]));
            });
        });
    });

    describe("#compress/#decompress", () => {
        it("should compress/decompress data", (done) => {
            const perMessageDeflate = new PerMessageDeflate({ threshold: 0 });

            perMessageDeflate.accept([{}]);
            perMessageDeflate.compress(Buffer.from([1, 2, 3]), true, (err, compressed) => {
                if (err) {
                    return done(err);
                }

                perMessageDeflate.decompress(compressed, true, (err, data) => {
                    if (err) {
                        return done(err);
                    }

                    assert.ok(data.equals(Buffer.from([1, 2, 3])));
                    done();
                });
            });
        });

        it("should compress/decompress fragments", (done) => {
            const perMessageDeflate = new PerMessageDeflate({ threshold: 0 });
            const buf = Buffer.from([1, 2, 3, 4]);

            perMessageDeflate.accept([{}]);

            perMessageDeflate.compress(buf.slice(0, 2), false, (err, compressed1) => {
                if (err) {
                    return done(err);
                }

                perMessageDeflate.compress(buf.slice(2), true, (err, compressed2) => {
                    if (err) {
                        return done(err);
                    }

                    perMessageDeflate.decompress(compressed1, false, (err, data1) => {
                        if (err) {
                            return done(err);
                        }

                        perMessageDeflate.decompress(compressed2, true, (err, data2) => {
                            if (err) {
                                return done(err);
                            }

                            assert.ok(Buffer.concat([data1, data2]).equals(Buffer.from([1, 2, 3, 4])));
                            done();
                        });
                    });
                });
            });
        });

        it("should compress/decompress data with parameters", (done) => {
            const perMessageDeflate = new PerMessageDeflate({
                threshold: 0,
                memLevel: 5
            });
            const extensions = Extensions.parse(
                "permessage-deflate; server_no_context_takeover; " +
                "client_no_context_takeover; server_max_window_bits=10; " +
                "client_max_window_bits=11"
            );

            perMessageDeflate.accept(extensions["permessage-deflate"]);

            perMessageDeflate.compress(Buffer.from([1, 2, 3]), true, (err, compressed) => {
                if (err) {
                    return done(err);
                }

                perMessageDeflate.decompress(compressed, true, (err, data) => {
                    if (err) {
                        return done(err);
                    }

                    assert.ok(data.equals(Buffer.from([1, 2, 3])));
                    done();
                });
            });
        });

        it("should compress/decompress data with no context takeover", (done) => {
            const perMessageDeflate = new PerMessageDeflate({ threshold: 0 });
            const extensions = Extensions.parse(
                "permessage-deflate; server_no_context_takeover; client_no_context_takeover"
            );
            const buf = Buffer.from("foofoo");

            perMessageDeflate.accept(extensions["permessage-deflate"]);

            perMessageDeflate.compress(buf, true, (err, compressed1) => {
                if (err) {
                    return done(err);
                }

                perMessageDeflate.decompress(compressed1, true, (err, data) => {
                    if (err) {
                        return done(err);
                    }

                    perMessageDeflate.compress(data, true, (err, compressed2) => {
                        if (err) {
                            return done(err);
                        }

                        perMessageDeflate.decompress(compressed2, true, (err, data) => {
                            if (err) {
                                return done(err);
                            }

                            assert.strictEqual(compressed2.length, compressed1.length);
                            assert.ok(data.equals(buf));
                            done();
                        });
                    });
                });
            });
        });
    });
});
