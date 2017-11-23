const start = require("./common");
const mongoose = adone.odm;
const random = adone.odm.utils.random;
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const DocumentObjectId = mongoose.Types.ObjectId;

describe("model: findOneAndRemove:", () => {
    let Comments;
    let BlogPost;
    let modelname;
    let collection;
    let strictSchema;

    before(() => {
        Comments = new Schema();

        Comments.add({
            title: String,
            date: Date,
            body: String,
            comments: [Comments]
        });

        BlogPost = new Schema({
            title: String,
            author: String,
            slug: String,
            date: Date,
            meta: {
                date: Date,
                visitors: Number
            },
            published: Boolean,
            mixed: {},
            numbers: [Number],
            owners: [ObjectId],
            comments: [Comments]
        });

        BlogPost.virtual("titleWithAuthor")
            .get(function () {
                return `${this.get("title")} by ${this.get("author")}`;
            })
            .set(function (val) {
                const split = val.split(" by ");
                this.set("title", split[0]);
                this.set("author", split[1]);
            });

        BlogPost.method("cool", function () {
            return this;
        });

        BlogPost.static("woot", function () {
            return this;
        });

        modelname = "RemoveOneBlogPost";
        mongoose.model(modelname, BlogPost);

        collection = `removeoneblogposts_${random()}`;

        strictSchema = new Schema({ name: String }, { strict: true });
        mongoose.model("RemoveOneStrictSchema", strictSchema);
    });

    it("returns the original document", (done) => {
        let db = start(),
            M = db.model(modelname, collection),
            title = "remove muah";

        const post = new M({ title });
        post.save((err) => {
            assert.ifError(err);
            M.findOneAndRemove({ title }, (err, doc) => {
                assert.ifError(err);
                assert.equal(post.id, doc.id);
                M.findById(post.id, function (err, gone) {
                    db.close();
                    assert.ifError(err);
                    assert.equal(gone, null);
                    done();
                });
            });
        });
    });

    it("options/conditions/doc are merged when no callback is passed", (done) => {
        let db = start(),
            M = db.model(modelname, collection);

        db.close();

        let now = new Date(),
            query;

        // Model.findOneAndRemove
        query = M.findOneAndRemove({ author: "aaron" }, { select: "author" });
        assert.equal(query._fields.author, 1);
        assert.equal(query._conditions.author, "aaron");

        query = M.findOneAndRemove({ author: "aaron" });
        assert.equal(query._fields, undefined);
        assert.equal(query._conditions.author, "aaron");

        query = M.findOneAndRemove();
        assert.equal(query.options.new, undefined);
        assert.equal(query._fields, undefined);
        assert.equal(query._conditions.author, undefined);

        // Query.findOneAndRemove
        query = M.where("author", "aaron").findOneAndRemove({ date: now });
        assert.equal(query._fields, undefined);
        assert.equal(query._conditions.date, now);
        assert.equal(query._conditions.author, "aaron");

        query = M.find().findOneAndRemove({ author: "aaron" }, { select: "author" });
        assert.equal(query._fields.author, 1);
        assert.equal(query._conditions.author, "aaron");

        query = M.find().findOneAndRemove();
        assert.equal(query._fields, undefined);
        assert.equal(query._conditions.author, undefined);
        done();
    });

    it("executes when a callback is passed", (done) => {
        let db = start(),
            M = db.model(modelname, collection + random()),
            pending = 5;

        M.findOneAndRemove({ name: "aaron1" }, { select: "name" }, cb);
        M.findOneAndRemove({ name: "aaron1" }, cb);
        M.where().findOneAndRemove({ name: "aaron1" }, { select: "name" }, cb);
        M.where().findOneAndRemove({ name: "aaron1" }, cb);
        M.where("name", "aaron1").findOneAndRemove(cb);

        function cb(err, doc) {
            assert.ifError(err);
            assert.equal(doc, null); // no previously existing doc
            if (--pending) {
                return;
            }
            db.close();
            done();
        }
    });

    it("executed with only a callback throws", (done) => {
        let db = start(),
            M = db.model(modelname, collection),
            err;

        try {
            M.findOneAndRemove(() => { });
        } catch (e) {
            err = e;
        }

        db.close();
        assert.ok(/First argument must not be a function/.test(err));
        done();
    });

    it("executed with only a callback throws", (done) => {
        let db = start(),
            M = db.model(modelname, collection),
            err;

        try {
            M.findByIdAndRemove(() => { });
        } catch (e) {
            err = e;
        }

        db.close();
        assert.ok(/First argument must not be a function/.test(err));
        done();
    });

    it("executes when a callback is passed", (done) => {
        let db = start(),
            M = db.model(modelname, collection + random()),
            _id = new DocumentObjectId(),
            pending = 2;

        M.findByIdAndRemove(_id, { select: "name" }, cb);
        M.findByIdAndRemove(_id, cb);

        function cb(err, doc) {
            assert.ifError(err);
            assert.equal(doc, null); // no previously existing doc
            if (--pending) {
                return;
            }
            db.close();
            done();
        }
    });

    it("returns the original document", (done) => {
        let db = start(),
            M = db.model(modelname, collection),
            title = "remove muah pleez";

        const post = new M({ title });
        post.save((err) => {
            assert.ifError(err);
            M.findByIdAndRemove(post.id, (err, doc) => {
                assert.ifError(err);
                assert.equal(post.id, doc.id);
                M.findById(post.id, function (err, gone) {
                    db.close();
                    assert.ifError(err);
                    assert.equal(gone, null);
                    done();
                });
            });
        });
    });

    it("options/conditions/doc are merged when no callback is passed", (done) => {
        let db = start(),
            M = db.model(modelname, collection),
            _id = new DocumentObjectId();

        db.close();

        let query;

        // Model.findByIdAndRemove
        query = M.findByIdAndRemove(_id, { select: "author" });
        assert.equal(query._fields.author, 1);
        assert.equal(query._conditions._id.toString(), _id.toString());

        query = M.findByIdAndRemove(_id.toString());
        assert.equal(query._fields, undefined);
        assert.equal(query._conditions._id, _id.toString());

        query = M.findByIdAndRemove();
        assert.equal(query.options.new, undefined);
        assert.equal(query._fields, undefined);
        assert.equal(query._conditions._id, undefined);
        done();
    });

    it("supports v3 select string syntax", (done) => {
        let db = start(),
            M = db.model(modelname, collection),
            _id = new DocumentObjectId();

        db.close();

        let query;

        query = M.findByIdAndRemove(_id, { select: "author -title" });
        assert.strictEqual(1, query._fields.author);
        assert.strictEqual(0, query._fields.title);

        query = M.findOneAndRemove({}, { select: "author -title" });
        assert.strictEqual(1, query._fields.author);
        assert.strictEqual(0, query._fields.title);
        done();
    });

    it("supports v3 select object syntax", (done) => {
        let db = start(),
            M = db.model(modelname, collection),
            _id = new DocumentObjectId();

        db.close();

        let query;

        query = M.findByIdAndRemove(_id, { select: { author: 1, title: 0 } });
        assert.strictEqual(1, query._fields.author);
        assert.strictEqual(0, query._fields.title);

        query = M.findOneAndRemove({}, { select: { author: 1, title: 0 } });
        assert.strictEqual(1, query._fields.author);
        assert.strictEqual(0, query._fields.title);
        done();
    });

    it("supports v3 sort string syntax", (done) => {
        let db = start(),
            M = db.model(modelname, collection),
            _id = new DocumentObjectId();

        db.close();

        let query;

        query = M.findByIdAndRemove(_id, { sort: "author -title" });
        assert.equal(Object.keys(query.options.sort).length, 2);
        assert.equal(query.options.sort.author, 1);
        assert.equal(query.options.sort.title, -1);

        query = M.findOneAndRemove({}, { sort: "author -title" });
        assert.equal(Object.keys(query.options.sort).length, 2);
        assert.equal(query.options.sort.author, 1);
        assert.equal(query.options.sort.title, -1);
        done();
    });

    it("supports v3 sort object syntax", (done) => {
        let db = start(),
            M = db.model(modelname, collection),
            _id = new DocumentObjectId();

        let query;

        query = M.findByIdAndRemove(_id, { sort: { author: 1, title: -1 } });
        assert.equal(Object.keys(query.options.sort).length, 2);
        assert.equal(query.options.sort.author, 1);
        assert.equal(query.options.sort.title, -1);

        query = M.findOneAndRemove(_id, { sort: { author: 1, title: -1 } });
        assert.equal(Object.keys(query.options.sort).length, 2);
        assert.equal(query.options.sort.author, 1);
        assert.equal(query.options.sort.title, -1);
        db.close(done);
    });

    it("supports population (gh-1395)", (done) => {
        const db = start();
        const M = db.model("A", { name: String });
        const N = db.model("B", { a: { type: Schema.ObjectId, ref: "A" }, i: Number });

        M.create({ name: "i am an A" }, (err, a) => {
            if (err) { return done(err); }
            N.create({ a: a._id, i: 10 }, (err, b) => {
                if (err) return done(err);

                N.findOneAndRemove({ _id: b._id }, { select: 'a -_id' })
                    .populate('a')
                    .exec(function (err, doc) {
                        if (err) return done(err);
                        assert.ok(doc);
                        assert.equal(doc._id, undefined);
                        assert.ok(doc.a);
                        assert.equal('i am an A', doc.a.name);
                        db.close(done);
                    });
            });
        });
    });

    describe("middleware", () => {
        let db;

        beforeEach(() => {
            db = start();
        });

        afterEach((done) => {
            db.close(done);
        });

        it("works", (done) => {
            let s = new Schema({
                topping: { type: String, default: "bacon" },
                base: String
            });

            let preCount = 0;
            s.pre("findOneAndRemove", () => {
                ++preCount;
            });

            let postCount = 0;
            s.post("findOneAndRemove", () => {
                ++postCount;
            });

            let Breakfast = db.model("gh-439", s);
            let breakfast = new Breakfast({
                base: "eggs"
            });

            breakfast.save((error) => {
                assert.ifError(error);

                Breakfast.findOneAndRemove(
                    { base: 'eggs' },
                    {},
                    function (error, breakfast) {
                        assert.ifError(error);
                        assert.equal(breakfast.base, 'eggs');
                        assert.equal(preCount, 1);
                        assert.equal(postCount, 1);
                        done();
                    });
            });
        });

        it("works with exec()", (done) => {
            let s = new Schema({
                topping: { type: String, default: "bacon" },
                base: String
            });

            let preCount = 0;
            s.pre("findOneAndRemove", () => {
                ++preCount;
            });

            let postCount = 0;
            s.post("findOneAndRemove", () => {
                ++postCount;
            });

            let Breakfast = db.model("gh-439", s);
            let breakfast = new Breakfast({
                base: "eggs"
            });

            breakfast.save((error) => {
                assert.ifError(error);

                Breakfast.
                    findOneAndRemove({ base: 'eggs' }, {}).
                    exec(function (error, breakfast) {
                        assert.ifError(error);
                        assert.equal(breakfast.base, 'eggs');
                        assert.equal(preCount, 1);
                        assert.equal(postCount, 1);
                        done();
                    });
            });
        });
    });
});