/* eslint-disable func-style */
const {
    web: { server }
} = adone;

const sget = require("simple-get").concat;

describe("register", () => {
    it("register", (done) => {
        const fastify = server();

        expect(5).checks(done);

        fastify.register((instance, opts, done) => {
            assert.notEqual(instance, fastify);
            assert.ok(fastify.isPrototypeOf(instance));

            assert.equal(typeof opts, "object");
            assert.equal(typeof done, "function");

            expect(true).to.be.ok.mark();

            instance.get("/first", (req, reply) => {
                reply.send({ hello: "world" });
            });
            done();
        });

        fastify.register((instance, opts, done) => {
            assert.notEqual(instance, fastify);
            assert.ok(fastify.isPrototypeOf(instance));

            assert.equal(typeof opts, "object");
            assert.equal(typeof done, "function");

            expect(true).to.be.ok.mark();

            instance.get("/second", (req, reply) => {
                reply.send({ hello: "world" });
            });
            done();
        });

        fastify.listen(0, (err) => {
            assert.notExists(err);
            fastify.server.unref();

            expect(true).to.be.ok.mark();

            makeRequest("first");
            makeRequest("second");
        });

        function makeRequest(path) {
            sget({
                method: "GET",
                url: `http://localhost:${fastify.server.address().port}/${path}`
            }, (err, response, body) => {
                assert.notExists(err);
                assert.strictEqual(response.statusCode, 200);
                assert.strictEqual(response.headers["content-length"], `${body.length}`);
                assert.deepEqual(JSON.parse(body), { hello: "world" });

                expect(true).to.be.ok.mark();
            });
        }
    });

    it("internal route declaration should pass the error generated by the register to the next handler / 1", (done) => {
        const fastify = server();

        fastify.register((instance, opts, next) => {
            next(new Error("kaboom"));
        });

        fastify.get("/", (req, reply) => {
            reply.send({ hello: "world" });
        });

        fastify.listen(0, (err) => {
            fastify.close();
            assert.equal(err.message, "kaboom");
            done();
        });
    });

    it("internal route declaration should pass the error generated by the register to the next handler / 2", (done) => {
        const fastify = server();

        expect(2).checks(done);

        fastify.register((instance, opts, next) => {
            next(new Error("kaboom"));
        });

        fastify.get("/", (req, reply) => {
            reply.send({ hello: "world" });
        });

        fastify.after((err) => {
            assert.equal(err.message, "kaboom");
            expect(true).to.be.ok.mark();
        });

        fastify.listen(0, (err) => {
            fastify.close();
            assert.notExists(err);
            expect(true).to.be.ok.mark();
        });
    });
});
