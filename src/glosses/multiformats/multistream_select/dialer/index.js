const util = require("../util");
const select = require("../select");

const {
    data: { varint },
    util: { once }
} = adone;

const PROTOCOL_ID = require("./../constants").PROTOCOL_ID;

const {
    p2p: { Connection },
    stream: { pull }
} = adone;
const { collect, map, take, lengthPrefixed } = pull;

/**
 *
 */
class Dialer {
    /**
     * Create a new Dialer.
     */
    constructor() {
        this.conn = null;
        this.log = util.log.dialer();
    }

    /**
     * Perform the multistream handshake.
     *
     * @param {Connection} rawConn - The connection on which
     * to perform the handshake.
     * @param {function(Error)} callback - Called when the handshake completed.
     * @returns {undefined}
     */
    handle(rawConn, callback) {
        this.log("dialer handle conn");
        callback = once(callback);
        const s = select(PROTOCOL_ID, (err, conn) => {
            if (err) {
                return callback(err);
            }
            this.log("handshake success");

            this.conn = new Connection(conn, rawConn);

            callback();
        }, this.log);

        // Handle unexpected errors from pull, like 'already piped'
        try {
            pull(
                rawConn,
                s,
                rawConn
            );
        } catch (err) {
            this.log.error(err);
            callback(err);
        }
    }

    /**
     * Select a protocol
     *
     * @param {string} protocol - A string of the protocol that we want to handshake.
     * @param {function(Error, Connection)} callback - `err` is
     * an error object that gets passed if something wrong happ
     * end (e.g: if the protocol selected is not supported by
     * the other end) and conn is the connection handshaked
     * with the other end.
     *
     * @returns {undefined}
     */
    select(protocol, callback) {
        this.log(`dialer select ${protocol}`);
        callback = once(callback);
        if (!this.conn) {
            return callback(new Error("multistream handshake has not finalized yet"));
        }

        const s = select(protocol, (err, conn) => {
            if (err) {
                this.conn = new Connection(conn, this.conn);
                return callback(err);
            }
            callback(null, new Connection(conn, this.conn));
        }, this.log);

        pull(
            this.conn,
            s,
            this.conn
        );
    }

    /**
     * List all available protocols.
     *
     * @param {function(Error, Array<string>)} callback - If
     * something wrong happend `Error` exists, otherwise
     * `protocols` is a list of the supported
     * protocols on the other end.
     *
     * @returns {undefined}
     */
    ls(callback) {
        callback = once(callback);

        const lsStream = select("ls", (err, conn) => {
            if (err) {
                return callback(err);
            }

            pull(
                conn,
                lengthPrefixed.decode(),
                collectLs(conn),
                map(stringify),
                collect((err, list) => {
                    if (err) {
                        return callback(err);
                    }
                    callback(null, list.slice(1));
                })
            );
        }, this.log);

        pull(
            this.conn,
            lsStream,
            this.conn
        );
    }
}

function stringify(buf) {
    return buf.toString().slice(0, -1);
}

function collectLs(conn) {
    const first = true;
    let counter = 0;

    return take((msg) => {
        if (first) {
            varint.decode(msg);
            counter = varint.decode(msg, varint.decode.bytes);
            return true;
        }

        return counter-- > 0;
    });
}

module.exports = Dialer;
