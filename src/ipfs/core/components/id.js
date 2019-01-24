

const promisify = require("promisify-es6");
const setImmediate = require("async/setImmediate");

const {
    is
} = adone;

const pkgversion = adone.package.version;

module.exports = function id(self) {
    return promisify((opts, callback) => {
        if (is.function(opts)) {
            callback = opts;
            opts = {};
        }

        setImmediate(() => callback(null, {
            id: self._peerInfo.id.toB58String(),
            publicKey: self._peerInfo.id.pubKey.bytes.toString("base64"),
            addresses: self._peerInfo.multiaddrs
                .toArray()
                .map((ma) => ma.toString())
                .filter((ma) => ma.indexOf("ipfs") >= 0)
                .sort(),
            agentVersion: `js-ipfs/${pkgversion}`,
            protocolVersion: "9000"
        }));
    });
};
