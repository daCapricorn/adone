import { sink, check, once } from "./helper";

const {
    fs: { readFileSync },
    logger,
    path: { join },
    std: { os }
} = adone;


const { pid } = process;
const hostname = os.hostname();
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe("basic", () => {

    it("bindings are exposed on every instance", async () => {
        const instance = logger();
        assert.deepEqual(instance.bindings(), {});
    });

    it("bindings contain the name and the child bindings", async () => {
        const instance = logger({ name: "basicTest", level: "info" }).child({ foo: "bar" }).child({ a: 2 });
        assert.deepEqual(instance.bindings(), { name: "basicTest", foo: "bar", a: 2 });
    });

    const levelTest = function (name, level) {
        it(`${name} logs as ${level}`, async () => {
            const stream = sink();
            const instance = logger(stream);
            instance.level = name;
            instance[name]("hello world");
            check(await once(stream, "data"), level, "hello world");
        });

        it(`passing objects at level ${name}`, async () => {
            const stream = sink();
            const instance = logger(stream);
            instance.level = name;
            const obj = { hello: "world" };
            instance[name](obj);

            const result = await once(stream, "data");
            assert.equal(new Date(result.time) <= new Date(), true, "time is greater than Date.now()");
            assert.equal(result.pid, pid);
            assert.equal(result.hostname, hostname);
            assert.equal(result.level, level);
            assert.equal(result.hello, "world");
            assert.equal(result.v, 1);
            assert.deepEqual(Object.keys(obj), ["hello"]);
        });

        it(`passing an object and a string at level ${name}`, async () => {
            const stream = sink();
            const instance = logger(stream);
            instance.level = name;
            const obj = { hello: "world" };
            instance[name](obj, "a string");
            const result = await once(stream, "data");
            assert.equal(new Date(result.time) <= new Date(), true, "time is greater than Date.now()");
            delete result.time;
            assert.deepEqual(result, {
                pid,
                hostname,
                level,
                msg: "a string",
                hello: "world",
                v: 1
            });
            assert.deepEqual(Object.keys(obj), ["hello"]);
        });

        it(`overriding object key by string at level ${name}`, async () => {
            const stream = sink();
            const instance = logger(stream);
            instance.level = name;
            instance[name]({ hello: "world", msg: "object" }, "string");
            const result = await once(stream, "data");
            assert.equal(new Date(result.time) <= new Date(), true, "time is greater than Date.now()");
            delete result.time;
            assert.deepEqual(result, {
                pid,
                hostname,
                level,
                msg: "string",
                hello: "world",
                v: 1
            });
        });

        it(`formatting logs as ${name}`, async () => {
            const stream = sink();
            const instance = logger(stream);
            instance.level = name;
            instance[name]("hello %d", 42);
            const result = await once(stream, "data");
            check(result, level, "hello 42");
        });

        it(`passing error with a serializer at level ${name}`, async () => {
            const stream = sink();
            const err = new Error("myerror");
            const instance = logger({
                serializers: {
                    err: logger.stdSerializers.err
                }
            }, stream);
            instance.level = name;
            instance[name]({ err });
            const result = await once(stream, "data");
            assert.equal(new Date(result.time) <= new Date(), true, "time is greater than Date.now()");
            delete result.time;
            assert.deepEqual(result, {
                pid,
                hostname,
                level,
                err: {
                    type: "Error",
                    message: err.message,
                    stack: err.stack
                },
                v: 1
            });
        });

        it(`child logger for level ${name}`, async () => {
            const stream = sink();
            const instance = logger(stream);
            instance.level = name;
            const child = instance.child({ hello: "world" });
            child[name]("hello world");
            const result = await once(stream, "data");
            assert.equal(new Date(result.time) <= new Date(), true, "time is greater than Date.now()");
            delete result.time;
            assert.deepEqual(result, {
                pid,
                hostname,
                level,
                msg: "hello world",
                hello: "world",
                v: 1
            });
        });
    };

    levelTest("fatal", 60);
    levelTest("error", 50);
    levelTest("warn", 40);
    levelTest("info", 30);
    levelTest("debug", 20);
    levelTest("trace", 10);

    it("serializers can return undefined to strip field", async () => {
        const stream = sink();
        const instance = logger({
            serializers: {
                test() {
                    return undefined;
                }
            }
        }, stream);

        instance.info({ test: "sensitive info" });
        const result = await once(stream, "data");
        assert.equal("test" in result, false);
    });

    it("does not explode with a circular ref", async () => {
        const stream = sink();
        const instance = logger(stream);
        const b = {};
        const a = {
            hello: b
        };
        b.a = a; // circular ref
        instance.info(a);
    });

    it("set the name", async () => {
        const stream = sink();
        const instance = logger({
            name: "hello"
        }, stream);
        instance.fatal("this is fatal");
        const result = await once(stream, "data");
        assert.equal(new Date(result.time) <= new Date(), true, "time is greater than Date.now()");
        delete result.time;
        assert.deepEqual(result, {
            pid,
            hostname,
            level: 60,
            name: "hello",
            msg: "this is fatal",
            v: 1
        });
    });

    it("set the messageKey", async () => {
        const stream = sink();
        const message = "hello world";
        const messageKey = "fooMessage";
        const instance = logger({
            messageKey
        }, stream);
        instance.info(message);
        const result = await once(stream, "data");
        assert.equal(new Date(result.time) <= new Date(), true, "time is greater than Date.now()");
        delete result.time;
        assert.deepEqual(result, {
            pid,
            hostname,
            level: 30,
            fooMessage: message,
            v: 1
        });
    });

    it("set undefined properties", async () => {
        const stream = sink();
        const instance = logger(stream);
        instance.info({ hello: "world", property: undefined });
        const result = await once(stream, "data");
        assert.equal(new Date(result.time) <= new Date(), true, "time is greater than Date.now()");
        delete result.time;
        assert.deepEqual(result, {
            pid,
            hostname,
            level: 30,
            hello: "world",
            v: 1
        });
    });

    it("prototype properties are not logged", async () => {
        const stream = sink();
        const instance = logger(stream);
        instance.info(Object.create({ hello: "world" }));
        const { hello } = await once(stream, "data");
        assert.equal(hello, undefined);
    });

    it("set the base", async () => {
        const stream = sink();
        const instance = logger({
            base: {
                a: "b"
            }
        }, stream);

        instance.fatal("this is fatal");
        const result = await once(stream, "data");
        assert.equal(new Date(result.time) <= new Date(), true, "time is greater than Date.now()");
        delete result.time;
        assert.deepEqual(result, {
            a: "b",
            level: 60,
            msg: "this is fatal",
            v: 1
        });
    });

    it("set the base to null", async () => {
        const stream = sink();
        const instance = logger({
            base: null
        }, stream);
        instance.fatal("this is fatal");
        const result = await once(stream, "data");
        assert.equal(new Date(result.time) <= new Date(), true, "time is greater than Date.now()");
        delete result.time;
        assert.deepEqual(result, {
            level: 60,
            msg: "this is fatal",
            v: 1
        });
    });

    it("set the base to null and use a serializer", async () => {
        const stream = sink();
        const instance = logger({
            base: null,
            serializers: {
                [Symbol.for("pino.*")]: (input) => {
                    return Object.assign({}, input, { additionalMessage: "using pino" });
                }
            }
        }, stream);
        instance.fatal("this is fatal too");
        const result = await once(stream, "data");
        assert.equal(new Date(result.time) <= new Date(), true, "time is greater than Date.now()");
        delete result.time;
        assert.deepEqual(result, {
            level: 60,
            msg: "this is fatal too",
            additionalMessage: "using pino",
            v: 1
        });
    });

    it("throw if creating child without bindings", async () => {
        const stream = sink();
        const instance = logger(stream);
        assert.throws(() => instance.child());
    });

    it("correctly escapes msg strings with stray double quote at end", async () => {
        const stream = sink();
        const instance = logger({
            name: "hello"
        }, stream);

        instance.fatal('this contains "');
        const result = await once(stream, "data");
        delete result.time;
        assert.deepEqual(result, {
            pid,
            hostname,
            level: 60,
            name: "hello",
            msg: 'this contains "',
            v: 1
        });
    });

    it("correctly escape msg strings with unclosed double quote", async () => {
        const stream = sink();
        const instance = logger({
            name: "hello"
        }, stream);
        instance.fatal('" this contains');
        const result = await once(stream, "data");
        delete result.time;
        assert.deepEqual(result, {
            pid,
            hostname,
            level: 60,
            name: "hello",
            msg: '" this contains',
            v: 1
        });
    });

    // https://github.com/pinojs/pino/issues/139
    it("object and format string", async () => {
        const stream = sink();
        const instance = logger(stream);
        instance.info({}, "foo %s", "bar");

        const result = await once(stream, "data");
        delete result.time;
        assert.deepEqual(result, {
            pid,
            hostname,
            level: 30,
            msg: "foo bar",
            v: 1
        });
    });

    it("object and format string property", async () => {
        const stream = sink();
        const instance = logger(stream);
        instance.info({ answer: 42 }, "foo %s", "bar");
        const result = await once(stream, "data");
        delete result.time;
        assert.deepEqual(result, {
            pid,
            hostname,
            level: 30,
            msg: "foo bar",
            answer: 42,
            v: 1
        });
    });

    it("correctly strip undefined when returned from toJSON", async () => {
        const stream = sink();
        const instance = logger({
            test: "this"
        }, stream);
        instance.fatal({
            test: {
                toJSON() {
                    return undefined;
                }
            }
        });
        const result = await once(stream, "data");
        assert.equal("test" in result, false);
    });

    it("correctly supports stderr", async () => {
        // stderr inherits from Stream, rather than Writable
        const dest = {
            writable: true,
            write(result) {
                result = JSON.parse(result);
                delete result.time;
                assert.deepEqual(result, {
                    pid,
                    hostname,
                    level: 60,
                    msg: "a message",
                    v: 1
                });
            }
        };
        const instance = logger(dest);
        instance.fatal("a message");
    });

    it("normalize number to string", async () => {
        const stream = sink();
        const instance = logger(stream);
        instance.info(1);
        const result = await once(stream, "data");
        delete result.time;
        assert.deepEqual(result, {
            pid,
            hostname,
            level: 30,
            msg: 1,
            v: 1
        });
    });

    it("normalize number to string with an object", async () => {
        const stream = sink();
        const instance = logger(stream);
        instance.info({ answer: 42 }, 1);
        const result = await once(stream, "data");
        delete result.time;
        assert.deepEqual(result, {
            pid,
            hostname,
            level: 30,
            msg: 1,
            answer: 42,
            v: 1
        });
    });

    it("handles objects with null prototype", async () => {
        const stream = sink();
        const instance = logger(stream);
        const o = Object.create(null);
        o.test = "test";
        instance.info(o);
        const result = await once(stream, "data");
        delete result.time;
        assert.deepEqual(result, {
            pid,
            hostname,
            level: 30,
            test: "test",
            v: 1
        });
    });

    it("pino.destination", async () => {
        const tmp = join(
            os.tmpdir(),
            `_${Math.random().toString(36).substr(2, 9)}`
        );
        const instance = logger(logger.destination(tmp));
        instance.info("hello");
        await sleep(250);
        const result = JSON.parse(readFileSync(tmp).toString());
        delete result.time;
        assert.deepEqual(result, {
            pid,
            hostname,
            level: 30,
            msg: "hello",
            v: 1
        });
    });

    it("auto pino.destination with a string", async () => {
        const tmp = join(
            os.tmpdir(),
            `_${Math.random().toString(36).substr(2, 9)}`
        );
        const instance = logger(tmp);
        instance.info("hello");
        await sleep(250);
        const result = JSON.parse(readFileSync(tmp).toString());
        delete result.time;
        assert.deepEqual(result, {
            pid,
            hostname,
            level: 30,
            msg: "hello",
            v: 1
        });
    });

    it("auto pino.destination with a string as second argument", async () => {
        const tmp = join(
            os.tmpdir(),
            `_${Math.random().toString(36).substr(2, 9)}`
        );
        const instance = logger(null, tmp);
        instance.info("hello");
        await sleep(250);
        const result = JSON.parse(readFileSync(tmp).toString());
        delete result.time;
        assert.deepEqual(result, {
            pid,
            hostname,
            level: 30,
            msg: "hello",
            v: 1
        });
    });

    it("does not override opts with a string as second argument", async () => {
        const tmp = join(
            os.tmpdir(),
            `_${Math.random().toString(36).substr(2, 9)}`
        );
        const instance = logger({
            timestamp: () => ',"time":"none"'
        }, tmp);
        instance.info("hello");
        await sleep(250);
        const result = JSON.parse(readFileSync(tmp).toString());
        assert.deepEqual(result, {
            pid,
            hostname,
            level: 30,
            time: "none",
            msg: "hello",
            v: 1
        });
    });

    // https://github.com/pinojs/pino/issues/222
    it("children with same names render in correct order", async () => {
        const stream = sink();
        const root = logger(stream);
        root.child({ a: 1 }).child({ a: 2 }).info({ a: 3 });
        const { a } = await once(stream, "data");
        assert.equal(a, 3, "last logged object takes precedence");
    });

    // https://github.com/pinojs/pino/pull/251 - use this.stringify
    it("use `fast-safe-stringify` to avoid circular dependencies", async () => {
        const stream = sink();
        const root = logger(stream);
        // circular depth
        const obj = {};
        obj.a = obj;
        root.info(obj);
        const { a } = await once(stream, "data");
        assert.deepEqual(a, { a: "[Circular]" });
    });

    it("fast-safe-stringify must be used when interpolating", async () => {
        const stream = sink();
        const instance = logger(stream);

        const o = { a: { b: {} } };
        o.a.b.c = o.a.b;
        instance.info("test", o);

        const { msg } = await once(stream, "data");
        assert.equal(msg, 'test {"a":{"b":{"c":"[Circular]"}}}');
    });

    it("throws when setting useOnlyCustomLevels without customLevels", async () => {
        assert.throws(() => {
            logger({
                useOnlyCustomLevels: true
            });
        });
        try {
            logger({
                useOnlyCustomLevels: true
            });
        } catch ({ message }) {
            assert.equal(message, "customLevels is required if useOnlyCustomLevels is set true");
        }
    });

    it("correctly log Infinity", async () => {
        const stream = sink();
        const instance = logger(stream);

        const o = { num: Infinity };
        instance.info(o);

        const { num } = await once(stream, "data");
        assert.equal(num, null);
    });

    it("correctly log -Infinity", async () => {
        const stream = sink();
        const instance = logger(stream);

        const o = { num: -Infinity };
        instance.info(o);

        const { num } = await once(stream, "data");
        assert.equal(num, null);
    });

    it("correctly log NaN", async () => {
        const stream = sink();
        const instance = logger(stream);

        const o = { num: NaN };
        instance.info(o);

        const { num } = await once(stream, "data");
        assert.equal(num, null);
    });
});