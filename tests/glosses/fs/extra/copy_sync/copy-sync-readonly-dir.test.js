const {
    fs: fse,
    path,
    std: { os }
} = adone;

// relevant: https://github.com/jprichardson/node-fs-extra/issues/599

const klawSync = require("klaw-sync");

let TEST_DIR = "";

const FILES = [
    path.join("dir1", "file1.txt"),
    path.join("dir1", "dir2", "file2.txt"),
    path.join("dir1", "dir2", "dir3", "file3.txt")
];

describe("+ copySync() - copy a readonly directory with content", () => {
    beforeEach((done) => {
        TEST_DIR = path.join(os.tmpdir(), "test", "fs-extra", "copy-readonly-dir");
        fse.emptyDir(TEST_DIR, done);
    });

    afterEach((done) => {
        klawSync(TEST_DIR).forEach((data) => fse.chmodSync(data.path, 0o777));
        fse.remove(TEST_DIR, done);
    });

    describe("> when src is readonly directory with content", () => {
        it("should copy successfully", () => {
            FILES.forEach((file) => {
                fse.outputFileSync(path.join(TEST_DIR, file), file);
            });
            const sourceDir = path.join(TEST_DIR, "dir1");
            const sourceHierarchy = klawSync(sourceDir);
            sourceHierarchy.forEach((source) => fse.chmodSync(source.path, source.stats.isDirectory() ? 0o555 : 0o444));

            const targetDir = path.join(TEST_DIR, "target");
            fse.copySync(sourceDir, targetDir);

            // Make sure copy was made and mode was preserved
            assert(fse.existsSync(targetDir));
            const targetHierarchy = klawSync(targetDir);
            assert(targetHierarchy.length === sourceHierarchy.length);
            targetHierarchy.forEach((target) => assert(target.stats.mode === target.stats.isDirectory() ? 0o555 : 0o444));
        });
    });
});
