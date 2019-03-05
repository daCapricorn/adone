const EventEmitter = require("events").EventEmitter;
const debug = require("debug");
const log = debug("spdy");
log.error = debug("spdy:error");

const {
    noop,
    p2p: { Connection, stream: { pull, catch: pullCatch, streamToPullStream: toPull } }
} = adone;

const catchError = function (stream) {
    return {
        source: pull(
            stream.source,
            pullCatch()
        ),
        sink: stream.sink
    };
};

const SPDY_CODEC = require("./spdy-codec");

module.exports = class Muxer extends EventEmitter {
    constructor(conn, spdy) {
        super();

        this.spdy = spdy;
        this.conn = conn;
        this.multicodec = SPDY_CODEC;

        spdy.start(3.1);

        // The rest of the API comes by default with SPDY
        spdy.on("close", (didError) => {
            // If we get a fatal ok error, just close
            if (didError && /ok/i.test(didError.message)) {
                didError = false;
            }
            spdy.destroyStreams(new Error("underlying socket has been closed"));
            this.emit("close", didError);
        });

        spdy.on("error", (err) => {
            if (!err) {
                return noop();
            }
            this.emit("error", err);
        });

        // needed by other spdy impl that need the response headers
        // in order to confirm the stream can be open
        spdy.on("stream", (stream) => {
            const muxedConn = new Connection(
                catchError(toPull.duplex(stream)),
                this.conn
            );
            this.emit("stream", muxedConn);
        });
    }

    /**
     * Conditionally emit errors if we have listeners. All other
     * events are sent to EventEmitter.emit
     *
     * @param {string} eventName
     * @param  {...any} args
     * @returns {void}
     */
    emit(eventName, ...args) {
        if (eventName === "error" && !this._events.error) {
            log.error("error", ...args);
        } else {
            super.emit(eventName, ...args);
        }
    }

    // method added to enable pure stream muxer feeling
    newStream(callback) {
        if (!callback) {
            callback = noop;
        }

        const stream = this.spdy.request({
            method: "POST",
            path: "/",
            headers: {}
        }, (err) => {
            if (err) {
                return callback(err);
            }
            callback(null, conn);
        });

        const conn = new Connection(
            catchError(toPull.duplex(stream)),
            this.conn
        );

        return conn;
    }

    end(cb) {
        cb = cb || noop;
        this.spdy.end((err) => {
            if (err && /ok/i.test(err.message)) {
                return cb();
            }
            cb(err);
        });
    }
};
