const { Schema } = adone.odm;

describe("schematype", () => {
    it("honors the selected option", (done) => {
        const s = new Schema({ thought: { type: String, select: false } });
        assert.ok(!s.path("thought").selected);

        const a = new Schema({ thought: { type: String, select: true } });
        assert.ok(a.path("thought").selected);
        done();
    });

    it("properly handles specifying index in combination with unique or sparse", (done) => {
        let s = new Schema({ name: { type: String, index: true, unique: true } });
        assert.deepEqual(s.path("name")._index, { unique: true });
        s = new Schema({ name: { type: String, unique: true, index: true } });
        assert.deepEqual(s.path("name")._index, { unique: true });
        s = new Schema({ name: { type: String, index: true, sparse: true } });
        assert.deepEqual(s.path("name")._index, { sparse: true });
        s = new Schema({ name: { type: String, sparse: true, index: true } });
        assert.deepEqual(s.path("name")._index, { sparse: true });
        done();
    });
});
