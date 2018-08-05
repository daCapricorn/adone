const {
    is,
    data: { bson2 }
} = adone;

const {
    Code,
    Binary,
    Timestamp,
    Long,
    ObjectId,
    DBRef,
    MinKey,
    MaxKey
} = bson2;

describe("data", "bson", "BSON Compliance", () => {
    it("Pass all corrupt BSON scenarios ./compliance/corrupt.json", (done) => {
        // Read and parse the json file
        const scenarios = require("./compliance/corrupt");

        for (let i = 0; i < scenarios.documents.length; i++) {
            const doc = scenarios.documents[i];
            if (doc.skip) {
                continue;
            }

            try {
                // Create a buffer containing the payload
                const buffer = Buffer.from(doc.encoded, "hex");
                // Attempt to deserialize
                bson2.decode(buffer);
                expect(false).to.be.ok;
            } catch (err) {
                expect(true).to.be.ok;
            }
        }

        done();
    });

    it("Pass all valid BSON serialization scenarios ./compliance/valid.json", (done) => {
        // Read and parse the json file
        const scenarios = require("./compliance/valid");

        // Translate extended json to correctly typed doc
        const translate = function (doc, object) {
            for (const name in doc) {
                if (
                    is.number(doc[name]) ||
                    is.string(doc[name]) ||
                    is.boolean(doc[name])
                ) {
                    object[name] = doc[name];
                } else if (is.array(doc[name])) {
                    object[name] = translate(doc[name], []);
                } else if (doc[name].$numberLong) {
                    object[name] = Long.fromString(doc[name].$numberLong);
                } else if (doc[name].$undefined) {
                    object[name] = null;
                } else if (doc[name].$date) {
                    const date = new Date();
                    date.setTime(parseInt(doc[name].$date.$numberLong, 10));
                    object[name] = date;
                } else if (doc[name].$regexp) {
                    object[name] = new RegExp(doc[name].$regexp, doc[name].$options || "");
                } else if (doc[name].$oid) {
                    object[name] = new ObjectId(doc[name].$oid);
                } else if (doc[name].$binary) {
                    object[name] = new Binary(doc[name].$binary, doc[name].$type || 1);
                } else if (doc[name].$timestamp) {
                    object[name] = Timestamp.fromBits(
                        parseInt(doc[name].$timestamp.t, 10),
                        parseInt(doc[name].$timestamp.i)
                    );
                } else if (doc[name].$ref) {
                    object[name] = new DBRef(doc[name].$ref, doc[name].$id, doc[name].$db);
                } else if (doc[name].$minKey) {
                    object[name] = new MinKey();
                } else if (doc[name].$maxKey) {
                    object[name] = new MaxKey();
                } else if (doc[name].$code) {
                    object[name] = new Code(doc[name].$code, doc[name].$scope || {});
                } else if (!is.nil(doc[name]) && typeof doc[name] === "object") {
                    object[name] = translate(doc[name], {});
                }
            }

            return object;
        };


        // Iterate over all the results
        scenarios.documents.forEach((doc) => {
            if (doc.skip) {
                return;
            }
            // Create a buffer containing the payload
            const expectedData = Buffer.from(doc.encoded, "hex");
            // Get the expectedDocument
            const expectedDocument = translate(doc.document, {});
            // Serialize to buffer
            const buffer = bson2.encode(expectedDocument);
            // Validate the output
            expect(expectedData.toString("hex")).to.equal(buffer.toString("hex"));
            // Attempt to deserialize
            const object = bson2.decode(buffer, { promoteLongs: false });
            // Validate the object
            expect(JSON.stringify(expectedDocument)).to.deep.equal(JSON.stringify(object));
        });

        done();
    });
});
