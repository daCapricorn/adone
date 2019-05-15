const {
    fs: fse,
    path,
    std: { fs, os }
} = adone;

const o755 = parseInt("755", 8);
const o777 = parseInt("777", 8);
const o666 = parseInt("666", 8);

describe("mkdirp / mkdirp", () => {
    let TEST_DIR;

    beforeEach((done) => {
        TEST_DIR = path.join(os.tmpdir(), "fs-extra", "mkdirp");
        fse.emptyDir(TEST_DIR, done);
    });

    afterEach((done) => fse.remove(TEST_DIR, done));

    it("should make the dir", (done) => {
        const x = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
        const y = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);
        const z = Math.floor(Math.random() * Math.pow(16, 4)).toString(16);

        const file = path.join(TEST_DIR, x, y, z);

        fse.mkdirp(file, o755, (err) => {
            assert.ifError(err);
            fse.pathExists(file, (err, ex) => {
                assert.ifError(err);
                assert.ok(ex, "file created");
                fs.stat(file, (err, stat) => {
                    assert.ifError(err);

                    if (os.platform().indexOf("win") === 0) {
                        assert.strictEqual(stat.mode & o777, o666);
                    } else {
                        assert.strictEqual(stat.mode & o777, o755);
                    }

                    assert.ok(stat.isDirectory(), "target not a directory");
                    done();
                });
            });
        });
    });
});
