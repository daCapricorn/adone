let db;
let leveldown;
let testCommon;
const { isTypedArray, verifyNotFoundError } = require("./util");

export const setUp = function (_leveldown, _testCommon) {
    describe("put()", () => {
        it("setUp common", _testCommon.setUp);
        it("setUp db", async () => {
            leveldown = _leveldown;
            testCommon = _testCommon;
            db = leveldown(testCommon.location());
            await db.open();
        });
    });
};

export const args = function () {
    describe("put()", () => {
        it("_serialize object", async () => {
            const db = leveldown(testCommon.location());
            db._put = function (key, value, opts, callback) {
                assert.ok(key);
                assert.ok(value);
                callback();
            };
            await db.put({}, {});
        });

        it("custom _serialize*", async () => {
            const db = leveldown(testCommon.location());
            db._serializeKey = db._serializeValue = function (data) {
                return data;
            };
            db._put = function (key, value, options, callback) {
                assert.deepEqual(key, { foo: "bar" });
                assert.deepEqual(value, { beep: "boop" });
                callback();
            };
            await db.put({ foo: "bar" }, { beep: "boop" });
        });
    });
};

export const put = function () {
    describe("put()", () => {
        it("simple put()", async () => {
            await db.put("foo", "bar");
            const value = await db.get("foo");
            let result = value.toString();
            if (isTypedArray(value)) {
                result = String.fromCharCode.apply(null, new Uint16Array(value));
            }
            assert.equal(result, "bar");
        });
    });
};

export const tearDown = function (testCommon) {
    describe("put()", () => {
        it("tearDown", async () => {
            await db.close();
            await testCommon.tearDown();
        });
    });
};

export const all = function (leveldown, testCommon) {
    setUp(leveldown, testCommon);
    args();
    put();
    tearDown(testCommon);
};