const {
    data: { varint },
    stream: { pull }
} = adone;
const { values, lengthPrefixed } = pull;

const lsHandler = function (self, conn) {
    const protos = Object.keys(self.handlers).filter((key) => key !== "ls");

    const nProtos = protos.length;
    // total size of the list of protocols, including varint and newline
    const size = protos.reduce((size, proto) => {
        const p = Buffer.from(`${proto}\n`);
        const el = varint.encodingLength(p.length);
        return size + el;
    }, 0);

    const buf = Buffer.concat([
        Buffer.from(varint.encode(nProtos)),
        Buffer.from(varint.encode(size)),
        Buffer.from("\n")
    ]);

    const encodedProtos = protos.map((proto) => {
        return Buffer.from(`${proto}\n`);
    });

    pull(
        values([buf].concat(encodedProtos)),
        lengthPrefixed.encode(),
        conn
    );
};

module.exports = lsHandler;
