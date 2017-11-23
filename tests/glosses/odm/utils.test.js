const start = require("./common");
const { StateMachine, utils, Schema } = adone.odm;
const ObjectId = adone.odm.types.ObjectId;
const MongooseBuffer = adone.odm.types.Buffer;

/**
 * Setup.
 */

const ActiveRoster = StateMachine.ctor("require", "init", "modify");

/**
 * Test.
 */

describe("utils", () => {
    describe("toCollectionName", () => {
        it("works (gh-3490)", (done) => {
            assert.equal(utils.toCollectionName("stations"), "stations");
            assert.equal(utils.toCollectionName("category"), "categories");
            done();
        });
    });

    describe("ActiveRoster", () => {
        it("should detect a path as required if it has been required", (done) => {
            const ar = new ActiveRoster();
            ar.require("hello");
            assert.equal(ar.paths.hello, "require");
            done();
        });

        it("should detect a path as inited if it has been inited", (done) => {
            const ar = new ActiveRoster();
            ar.init("hello");
            assert.equal(ar.paths.hello, "init");
            done();
        });

        it("should detect a path as modified", (done) => {
            const ar = new ActiveRoster();
            ar.modify("hello");
            assert.equal(ar.paths.hello, "modify");
            done();
        });

        it("should remove a path from an old state upon a state change", (done) => {
            const ar = new ActiveRoster();
            ar.init("hello");
            ar.modify("hello");
            assert.ok(!ar.states.init.hasOwnProperty("hello"));
            assert.ok(ar.states.modify.hasOwnProperty("hello"));
            done();
        });

        it("forEach should be able to iterate through the paths belonging to one state", (done) => {
            const ar = new ActiveRoster();
            ar.init("hello");
            ar.init("goodbye");
            ar.modify("world");
            ar.require("foo");
            ar.forEach("init", (path) => {
                assert.ok(~["hello", "goodbye"].indexOf(path));
            });
            done();
        });

        it("forEach should be able to iterate through the paths in the union of two or more states", (done) => {
            const ar = new ActiveRoster();
            ar.init("hello");
            ar.init("goodbye");
            ar.modify("world");
            ar.require("foo");
            ar.forEach("modify", "require", (path) => {
                assert.ok(~["world", "foo"].indexOf(path));
            });
            done();
        });

        it("forEach should iterate through all paths that have any state if given no state arguments", (done) => {
            const ar = new ActiveRoster();
            ar.init("hello");
            ar.init("goodbye");
            ar.modify("world");
            ar.require("foo");
            ar.forEach((path) => {
                assert.ok(~["hello", "goodbye", "world", "foo"].indexOf(path));
            });
            done();
        });

        it("should be able to detect if at least one path exists in a set of states", (done) => {
            const ar = new ActiveRoster();
            ar.init("hello");
            ar.modify("world");
            assert.ok(ar.some("init"));
            assert.ok(ar.some("modify"));
            assert.ok(!ar.some("require"));
            assert.ok(ar.some("init", "modify"));
            assert.ok(ar.some("init", "require"));
            assert.ok(ar.some("modify", "require"));
            done();
        });

        it("should be able to `map` over the set of paths in a given state", (done) => {
            const ar = new ActiveRoster();
            ar.init("hello");
            ar.modify("world");
            ar.require("iAmTheWalrus");
            const suffixedPaths = ar.map("init", "modify", (path) => {
                return `${path}-suffix`;
            });
            assert.deepEqual(suffixedPaths, ["hello-suffix", "world-suffix"]);
            done();
        });

        it("should `map` over all states' paths if no states are specified in a `map` invocation", (done) => {
            const ar = new ActiveRoster();
            ar.init("hello");
            ar.modify("world");
            ar.require("iAmTheWalrus");
            const suffixedPaths = ar.map((path) => {
                return `${path}-suffix`;
            });
            assert.deepEqual(suffixedPaths, ["iAmTheWalrus-suffix", "hello-suffix", "world-suffix"]);
            done();
        });
    });

    it("utils.options", (done) => {
        const o = { a: 1, b: 2, c: 3, 0: "zero1" };
        const defaults = { b: 10, d: 20, 0: "zero2" };
        const result = utils.options(defaults, o);
        assert.equal(result.a, 1);
        assert.equal(result.b, 2);
        assert.equal(result.c, 3);
        assert.equal(result.d, 20);
        assert.deepEqual(o.d, result.d);
        assert.equal(result["0"], "zero1");

        const result2 = utils.options(defaults);
        assert.equal(result2.b, 10);
        assert.equal(result2.d, 20);
        assert.equal(result2["0"], "zero2");

        // same properties/vals
        assert.deepEqual(defaults, result2);

        // same object
        assert.notEqual(defaults, result2);
        done();
    });

    it("deepEquals on ObjectIds", (done) => {
        const s = (new ObjectId()).toString();

        let a = new ObjectId(s),
            b = new ObjectId(s);

        assert.ok(utils.deepEqual(a, b));
        assert.ok(utils.deepEqual(a, a));
        assert.ok(!utils.deepEqual(a, new ObjectId()));
        done();
    });

    it("deepEquals on MongooseDocumentArray works", (done) => {
        let db = start(),
            A = new Schema({ a: String }),
            M = db.model("deepEqualsOnMongooseDocArray", new Schema({
                a1: [A],
                a2: [A]
            }));

        db.close();

        const m1 = new M({
            a1: [{ a: "Hi" }, { a: "Bye" }]
        });

        m1.a2 = m1.a1;
        assert.ok(utils.deepEqual(m1.a1, m1.a2));

        const m2 = new M();
        m2.init(m1.toObject());

        assert.ok(utils.deepEqual(m1.a1, m2.a1));

        m2.set(m1.toObject());
        assert.ok(utils.deepEqual(m1.a1, m2.a1));
        done();
    });

    // gh-688
    it("deepEquals with MongooseBuffer", (done) => {
        const str = "this is the day";
        const a = new MongooseBuffer(str);
        const b = new MongooseBuffer(str);
        const c = new Buffer(str);
        const d = new Buffer("this is the way");
        const e = new Buffer("other length");

        assert.ok(utils.deepEqual(a, b));
        assert.ok(utils.deepEqual(a, c));
        assert.ok(!utils.deepEqual(a, d));
        assert.ok(!utils.deepEqual(a, e));
        assert.ok(!utils.deepEqual(a, []));
        assert.ok(!utils.deepEqual([], a));
        done();
    });

    describe("clone", () => {
        it("retains RegExp options gh-1355", (done) => {
            const a = new RegExp("hello", "igm");
            assert.ok(a.global);
            assert.ok(a.ignoreCase);
            assert.ok(a.multiline);

            const b = utils.clone(a);
            assert.equal(b.source, a.source);
            assert.equal(a.global, b.global);
            assert.equal(a.ignoreCase, b.ignoreCase);
            assert.equal(a.multiline, b.multiline);
            done();
        });

        it("clones objects created with Object.create(null)", (done) => {
            const o = Object.create(null);
            o.a = 0;
            o.b = "0";
            o.c = 1;
            o.d = "1";

            const out = utils.clone(o);
            assert.strictEqual(0, out.a);
            assert.strictEqual("0", out.b);
            assert.strictEqual(1, out.c);
            assert.strictEqual("1", out.d);
            assert.equal(Object.keys(out).length, 4);

            done();
        });
    });

    it("array.flatten", (done) => {
        const orig = [0, [1, 2, [3, 4, [5, [6]], 7], 8], 9];
        assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9], utils.array.flatten(orig));
        done();
    });

    it("array.unique", (done) => {
        const case1 = [1, 2, 3, 3, 5, "a", 6, "a"];
        assert.deepEqual(utils.array.unique(case1), [1, 2, 3, 5, "a", 6]);
        const objId = new ObjectId("000000000000000000000001");
        const case2 = [
            1,
            "000000000000000000000001",
            1,
            objId,
            "000000000000000000000001",
            objId,
            1
        ];
        assert.deepEqual(utils.array.unique(case2),
            [1, "000000000000000000000001", objId]);
        done();
    });

    describe("merge", () => {
        it("merges two objects together without overriding properties & methods", (done) => {
            function To() {
                this.name = "to";
                this.toProperty = true;
            }
            To.prototype.getName = function () { };
            To.prototype.toMethod = function () { };

            function From() {
                this.name = "from";
                this.fromProperty = true;
            }
            From.prototype.getName = function () { };
            From.prototype.fromMethod = function () { };

            const to = new To();
            const from = new From();

            utils.merge(to, from);

            assert.equal(to.name, "to");
            assert.equal(to.toProperty, true);
            assert.equal(to.fromProperty, true);
            assert.ok(to.getName === To.prototype.getName);
            assert.ok(to.toMethod === To.prototype.toMethod);
            assert.equal(to.fomMethod, From.prototype.fomMethod);

            done();
        });
    });

    describe("pluralize", () => {
        let db;

        before(() => {
            db = start();
        });

        after((done) => {
            db.close(done);
        });

        it("should not pluralize _temp_ (gh-1703)", (done) => {
            const ASchema = new Schema({
                value: { type: Schema.Types.Mixed }
            });

            const collectionName = "_temp_";
            const A = db.model(collectionName, ASchema);
            assert.equal(A.collection.name, collectionName);
            done();
        });
        it("should pluralize _temp (gh-1703)", (done) => {
            const ASchema = new Schema({
                value: { type: Schema.Types.Mixed }
            });

            const collectionName = "_temp";
            const A = db.model(collectionName, ASchema);
            assert.equal(A.collection.name, `${collectionName}s`);
            done();
        });
        describe("option (gh-1707)", () => {
            it("should pluralize by default", (done) => {
                let ASchema = new Schema({ value: String });

                let collectionName = "singular";
                let A = db.model(collectionName, ASchema);
                assert.equal(A.collection.name, `${collectionName}s`);
                done();
            });
            it("should pluralize when global option set to true", (done) => {
                db.base.set("pluralization", true);

                let ASchema = new Schema({ value: String });

                let collectionName = "one";
                let A = db.model(collectionName, ASchema);
                assert.equal(A.collection.name, `${collectionName}s`);
                done();
            });
            it("should not pluralize when global option set to false", (done) => {
                db.base.set("pluralization", false);

                let ASchema = new Schema({ value: String });

                let collectionName = "two";
                let A = db.model(collectionName, ASchema);
                assert.equal(A.collection.name, collectionName);
                done();
            });
            it("should pluralize when local option set to true", (done) => {
                db.base.set("pluralization", false);

                // override
                let ASchema = new Schema({ value: String }, { pluralization: true });

                let collectionName = "three";
                let A = db.model(collectionName, ASchema);
                assert.equal(A.collection.name, `${collectionName}s`);
                done();
            });
            it("should not pluralize when local option set to false and global is true", (done) => {
                db.base.set("pluralization", true);

                let ASchema = new Schema({ value: String }, { pluralization: false });

                let collectionName = "four";
                let A = db.model(collectionName, ASchema);
                assert.equal(A.collection.name, collectionName);
                done();
            });
            it("should not pluralize when local option set to false and global not set", (done) => {
                let ASchema = new Schema({ value: String }, { pluralization: false });

                let collectionName = "five";
                let A = db.model(collectionName, ASchema);
                assert.equal(A.collection.name, collectionName);
                done();
            });
        });
    });
});