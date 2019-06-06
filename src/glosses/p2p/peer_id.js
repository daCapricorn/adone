// const cryptoKeys = require("libp2p-crypto/src/keys");
const withIs = require("class-is");

const {
    async: { waterfall },
    is,
    multiformat: { multihash: mh },
    p2p: { crypto: { keys: cryptoKeys } }
} = adone;

class PeerId {
    constructor(id, privKey, pubKey) {
        if (!is.buffer(id)) {
            throw new adone.error.InvalidArgumentException("Invalid id provided");
        }

        if (privKey && pubKey) {
            if (!privKey.public.bytes.equals(pubKey.bytes)) {
                throw new adone.error.InvalidArgumentException("Inconsistent arguments");
            }
        }

        this._id = id;
        this._idB58String = mh.toB58String(this.id);
        this._privKey = privKey;
        this._pubKey = pubKey;
    }

    get id() {
        return this._id;
    }

    set id(val) {
        throw new Error("Id is immutable");
    }

    get privKey() {
        return this._privKey;
    }

    set privKey(privKey) {
        this._privKey = privKey;
    }

    get pubKey() {
        if (this._pubKey) {
            return this._pubKey;
        }

        if (this._privKey) {
            return this._privKey.public;
        }
    }

    set pubKey(pubKey) {
        this._pubKey = pubKey;
    }

    // Return the protobuf version of the public key, matching go ipfs formatting
    marshalPubKey() {
        if (this.pubKey) {
            return cryptoKeys.marshalPublicKey(this.pubKey);
        }
    }

    // Return the protobuf version of the private key, matching go ipfs formatting
    marshalPrivKey() {
        if (this.privKey) {
            return cryptoKeys.marshalPrivateKey(this.privKey);
        }
    }

    toPrint() {
        let pid = this.toB58String();
        // All sha256 nodes start with Qm
        // We can skip the Qm to make the peer.ID more useful
        if (pid.startsWith("Qm")) {
            pid = pid.slice(2);
        }
        let maxRunes = 6;
        if (pid.length < maxRunes) {
            maxRunes = pid.length;
        }

        return `<peer.ID ${pid.substr(0, maxRunes)}>`;
    }

    // return the jsonified version of the key, matching the formatting
    // of go-ipfs for its config file
    toJSON() {
        return {
            id: this.toB58String(),
            privKey: toB64Opt(this.marshalPrivKey()),
            pubKey: toB64Opt(this.marshalPubKey())
        };
    }

    // encode/decode functions
    toHexString() {
        return mh.toHexString(this.id);
    }

    toBytes() {
        return this.id;
    }

    toB58String() {
        return this._idB58String;
    }

    isEqual(id) {
        if (is.buffer(id)) {
            return this.id.equals(id);
        } else if (id.id) {
            return this.id.equals(id.id);
        }
        throw new Error("not valid Id");

    }

    /**
     * Check if this PeerId instance is valid (privKey -> pubKey -> Id)
     */
    isValid(callback) {
        // TODO Needs better checking
        if (this.privKey &&
            this.privKey.public &&
            this.privKey.public.bytes &&
            is.buffer(this.pubKey.bytes) &&
            this.privKey.public.bytes.equals(this.pubKey.bytes)) {
            callback();
        } else {
            callback(new Error("Keys not match"));
        }
    }
}

const PeerIdWithIs = withIs(PeerId, { className: "PeerId", symbolName: "@libp2p/js-peer-id/PeerId" });

exports = module.exports = PeerIdWithIs;

// generation
exports.create = function (opts, callback) {
    if (is.function(opts)) {
        callback = opts;
        opts = {};
    }
    opts = opts || {};
    opts.bits = opts.bits || 2048;

    waterfall([
        (cb) => cryptoKeys.generateKeyPair("RSA", opts.bits, cb),
        (privKey, cb) => privKey.public.hash((err, digest) => {
            cb(err, digest, privKey);
        })
    ], (err, digest, privKey) => {
        if (err) {
            return callback(err);
        }

        callback(null, new PeerIdWithIs(digest, privKey));
    });
};

exports.createFromHexString = function (str) {
    return new PeerIdWithIs(mh.fromHexString(str));
};

exports.createFromBytes = function (buf) {
    return new PeerIdWithIs(buf);
};

exports.createFromB58String = function (str) {
    return new PeerIdWithIs(mh.fromB58String(str));
};

// Public Key input will be a buffer
exports.createFromPubKey = function (key, callback) {
    if (!is.function(callback)) {
        throw new Error("callback is required");
    }

    let pubKey;

    try {
        let buf = key;
        if (is.string(buf)) {
            buf = Buffer.from(key, "base64");
        }

        if (!is.buffer(buf)) {
            throw new Error("Supplied key is neither a base64 string nor a buffer");
        }

        pubKey = cryptoKeys.unmarshalPublicKey(buf);
    } catch (err) {
        return callback(err);
    }

    pubKey.hash((err, digest) => {
        if (err) {
            return callback(err);
        }

        callback(null, new PeerIdWithIs(digest, null, pubKey));
    });
};

// Private key input will be a string
exports.createFromPrivKey = function (key, callback) {
    if (!is.function(callback)) {
        throw new Error("callback is required");
    }

    let buf = key;

    try {
        if (is.string(buf)) {
            buf = Buffer.from(key, "base64");
        }

        if (!is.buffer(buf)) {
            throw new Error("Supplied key is neither a base64 string nor a buffer");
        }
    } catch (err) {
        return callback(err);
    }

    waterfall([
        (cb) => cryptoKeys.unmarshalPrivateKey(buf, cb),
        (privKey, cb) => privKey.public.hash((err, digest) => {
            cb(err, digest, privKey);
        })
    ], (err, digest, privKey) => {
        if (err) {
            return callback(err);
        }

        callback(null, new PeerIdWithIs(digest, privKey, privKey.public));
    });
};

exports.createFromJSON = function (obj, callback) {
    if (!is.function(callback)) {
        throw new Error("callback is required");
    }

    let id;
    let rawPrivKey;
    let rawPubKey;
    let pub;

    try {
        id = mh.fromB58String(obj.id);
        rawPrivKey = obj.privKey && Buffer.from(obj.privKey, "base64");
        rawPubKey = obj.pubKey && Buffer.from(obj.pubKey, "base64");
        pub = rawPubKey && cryptoKeys.unmarshalPublicKey(rawPubKey);
    } catch (err) {
        return callback(err);
    }

    if (rawPrivKey) {
        waterfall([
            (cb) => cryptoKeys.unmarshalPrivateKey(rawPrivKey, cb),
            (priv, cb) => priv.public.hash((err, digest) => {
                cb(err, digest, priv);
            }),
            (privDigest, priv, cb) => {
                if (pub) {
                    pub.hash((err, pubDigest) => {
                        cb(err, privDigest, priv, pubDigest);
                    });
                } else {
                    cb(null, privDigest, priv);
                }
            }
        ], (err, privDigest, priv, pubDigest) => {
            if (err) {
                return callback(err);
            }

            if (pub && !privDigest.equals(pubDigest)) {
                return callback(new Error("Public and private key do not match"));
            }

            if (id && !privDigest.equals(id)) {
                return callback(new Error("Id and private key do not match"));
            }

            callback(null, new PeerIdWithIs(id, priv, pub));
        });
    } else {
        callback(null, new PeerIdWithIs(id, null, pub));
    }
};

exports.isPeerId = function (peerId) {
    return Boolean(typeof peerId === "object" &&
        peerId._id &&
        peerId._idB58String);
};

function toB64Opt(val) {
    if (val) {
        return val.toString("base64");
    }
}
