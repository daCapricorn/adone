const {
    fs2: fs
} = adone;

const path = require("path");
const os = require("os");

describe("pathExists()", () => {
    let TEST_DIR;

    beforeEach((done) => {
        TEST_DIR = path.join(os.tmpdir(), "fs-extra", "path-exists");
        fs.emptyDir(TEST_DIR, done);
    });

    afterEach((done) => fs.remove(TEST_DIR, done));

    it("should return false if file does not exist", () => {
        return fs.pathExists(path.join(TEST_DIR, "somefile"))
            .then((exists) => assert(!exists));
    });

    it("should return true if file does exist", () => {
        const file = path.join(TEST_DIR, "exists");
        fs.createFileSync(file);
        return fs.pathExists(file)
            .then((exists) => assert(exists));
    });

    it("should pass an empty error parameter to the callback", (done) => {
        const file = path.join(TEST_DIR, "exists");
        fs.createFileSync(file);
        fs.pathExists(file, (err, exists) => {
            assert.ifError(err);
            assert(exists);
            done();
        });
    });
});