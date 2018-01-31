const fixtures = require("./fixtures/go-key-rsa");

const {
    net: { p2p: { crypto } }
} = adone;

describe("crypto", function () {
    this.timeout(20 * 1000);
    let key;
    before(function () {
        this.timeout(20000);
        key = crypto.keys.generateKeyPair("rsa", 2048);
    });

    it("marshalPublicKey and unmarshalPublicKey", () => {
        const key2 = crypto.keys.unmarshalPublicKey(crypto.keys.marshalPublicKey(key.public));

        expect(key2.equals(key.public)).to.be.eql(true);

        expect(() => {
            crypto.keys.marshalPublicKey(key.public, "invalid-key-type");
        }).to.throw();
    });

    it("marshalPrivateKey and unmarshalPrivateKey", () => {
        expect(() => {
            crypto.keys.marshalPrivateKey(key, "invalid-key-type");
        }).to.throw();

        const key2 = crypto.keys.unmarshalPrivateKey(crypto.keys.marshalPrivateKey(key));
        expect(key2.equals(key)).to.be.eql(true);
        expect(key2.public.equals(key.public)).to.be.eql(true);
    });

    // marshalled keys seem to be slightly different
    // unsure as to if this is just a difference in encoding
    // or a bug
    describe("go interop", () => {
        it("unmarshals private key", () => {
            const key = crypto.keys.unmarshalPrivateKey(fixtures.private.key);
            const hash = fixtures.private.hash;
            expect(fixtures.private.key).to.eql(key.bytes);

            const digest = key.hash();
            expect(digest).to.eql(hash);
        });

        it("unmarshals public key", () => {
            const key = crypto.keys.unmarshalPublicKey(fixtures.public.key);
            const hash = fixtures.public.hash;

            expect(crypto.keys.marshalPublicKey(key)).to.eql(fixtures.public.key);

            const digest = key.hash();
            expect(digest).to.eql(hash);
        });

        it("unmarshal -> marshal, private key", () => {
            const key = crypto.keys.unmarshalPrivateKey(fixtures.private.key);
            const marshalled = crypto.keys.marshalPrivateKey(key);
            expect(marshalled).to.eql(fixtures.private.key);
        });

        it("unmarshal -> marshal, public key", () => {
            const key = crypto.keys.unmarshalPublicKey(fixtures.public.key);
            const marshalled = crypto.keys.marshalPublicKey(key);
            expect(fixtures.public.key.equals(marshalled)).to.eql(true);
        });
    });

    describe.only("pbkdf2", () => {
        it("generates a derived password using sha1", () => {
            const p1 = crypto.pbkdf2("password", "at least 16 character salt", 500, 512 / 8, "sha1");
            assert.exists(p1);
            expect(p1).to.be.a("string");
        });

        it("generates a derived password using sha2-512", () => {
            const p1 = crypto.pbkdf2("password", "at least 16 character salt", 500, 512 / 8, "sha2-512");
            assert.exists(p1);
            expect(p1).to.be.a("string");
        });

        it("generates the same derived password with the same options", () => {
            const p1 = crypto.pbkdf2("password", "at least 16 character salt", 10, 512 / 8, "sha1");
            const p2 = crypto.pbkdf2("password", "at least 16 character salt", 10, 512 / 8, "sha1");
            const p3 = crypto.pbkdf2("password", "at least 16 character salt", 11, 512 / 8, "sha1");
            expect(p2).to.equal(p1);
            expect(p3).to.not.equal(p2);
        });

        it("throws on invalid hash name", () => {
            expect(() => crypto.pbkdf2("password", "at least 16 character salt", 500, 512 / 8, "shaX-xxx")).to.throw();
        });
    });

    describe("randomBytes", () => {
        it("throws with no number passed", () => {
            expect(() => {
                crypto.randomBytes();
            }).to.throw();
        });

        it("generates different random things", () => {
            const buf1 = crypto.randomBytes(10);
            expect(buf1.length).to.equal(10);
            const buf2 = crypto.randomBytes(10);
            expect(buf1).to.not.eql(buf2);
        });
    });
});