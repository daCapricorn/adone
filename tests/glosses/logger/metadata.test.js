const os = require("os");

const { pid } = process;
const hostname = os.hostname();

describe("metadata", () => {
    it("metadata works", async () => {
        const now = Date.now();
        const instance = adone.logger({}, {
            [Symbol.for("pino.metadata")]: true,
            write(chunk) {
                assert.equal(instance, this.lastLogger);
                assert.equal(30, this.lastLevel);
                assert.equal("a msg", this.lastMsg);
                assert.ok(Number(this.lastTime) >= now);
                assert.deepEqual(this.lastObj, { hello: "world", msg: "a msg" });
                const result = JSON.parse(chunk);
                assert.ok(new Date(result.time) <= new Date(), "time is greater than Date.now()");
                delete result.time;
                assert.deepEqual(result, {
                    pid,
                    hostname,
                    level: 30,
                    hello: "world",
                    msg: "a msg",
                    v: 1
                });
            }
        });

        instance.info({ hello: "world" }, "a msg");
    });

    it("child loggers works", async () => {
        const instance = adone.logger({}, {
            [Symbol.for("pino.metadata")]: true,
            write(chunk) {
                assert.equal(child, this.lastLogger);
                assert.equal(30, this.lastLevel);
                assert.equal("a msg", this.lastMsg);
                assert.deepEqual(this.lastObj, { from: "child", msg: "a msg" });
                const result = JSON.parse(chunk);
                assert.ok(new Date(result.time) <= new Date(), "time is greater than Date.now()");
                delete result.time;
                assert.deepEqual(result, {
                    pid,
                    hostname,
                    level: 30,
                    hello: "world",
                    from: "child",
                    msg: "a msg",
                    v: 1
                });
            }
        });

        const child = instance.child({ hello: "world" });
        child.info({ from: "child" }, "a msg");
    });

    it("without object", async () => {
        const instance = adone.logger({}, {
            [Symbol.for("pino.metadata")]: true,
            write(chunk) {
                assert.equal(instance, this.lastLogger);
                assert.equal(30, this.lastLevel);
                assert.equal("a msg", this.lastMsg);
                assert.deepEqual({ msg: "a msg" }, this.lastObj);
                const result = JSON.parse(chunk);
                assert.ok(new Date(result.time) <= new Date(), "time is greater than Date.now()");
                delete result.time;
                assert.deepEqual(result, {
                    pid,
                    hostname,
                    level: 30,
                    msg: "a msg",
                    v: 1
                });
            }
        });

        instance.info("a msg");
    });

    it("without msg", async () => {
        const instance = adone.logger({}, {
            [Symbol.for("pino.metadata")]: true,
            write(chunk) {
                assert.equal(instance, this.lastLogger);
                assert.equal(30, this.lastLevel);
                assert.equal(undefined, this.lastMsg);
                assert.deepEqual({ hello: "world" }, this.lastObj);
                const result = JSON.parse(chunk);
                assert.ok(new Date(result.time) <= new Date(), "time is greater than Date.now()");
                delete result.time;
                assert.deepEqual(result, {
                    pid,
                    hostname,
                    level: 30,
                    hello: "world",
                    v: 1
                });
            }
        });

        instance.info({ hello: "world" });
    });
});