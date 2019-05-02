const {
    is
} = adone;

const poolSize = 10 * 1024;

const createPool = () => Buffer.alloc(poolSize);

const encode = (opts) => {
    opts = Object.assign({
        fixed: false
    }, opts || {});

    // Only needed for varint
    const varint = require("varint");
    let pool = opts.fixed ? null : createPool();
    let used = 0;

    let ended = false;
    let first = true;

    return (read) => (end, cb) => {
        if (end) {
            ended = end;
        }
        if (ended) {
            return cb(ended);
        }

        read(null, (end, data) => {
            if (end) {
                ended = end;
            }
            if (ended && !first) {
                return cb(ended);
            }

            first = false;

            if (!ended && !is.buffer(data)) {
                ended = new Error("data must be a buffer");
                return cb(ended);
            }

            const dataLength = ended ? 0 : data.length;

            let encodedLength;
            if (opts.fixed) {
                encodedLength = Buffer.alloc(4);
                encodedLength.writeInt32BE(dataLength, 0); // writes exactly 4 bytes
            } else {
                varint.encode(dataLength, pool, used);
                used += varint.encode.bytes;
                encodedLength = pool.slice(used - varint.encode.bytes, used);

                if (pool.length - used < 100) {
                    pool = createPool();
                    used = 0;
                }
            }

            if (ended) {
                return cb(null, encodedLength);
            }

            cb(null, Buffer.concat([
                encodedLength,
                data
            ], (opts.fixed ? 4 : varint.encode.bytes) + dataLength));
        });
    };
};

module.exports = encode;
