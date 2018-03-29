const {
    assert,
    is,
    net: { spdy }
} = adone;

const { protocol: { base, http2: { constants } } } = spdy;

const WriteBuffer = require("wbuf");
const OffsetBuffer = require("obuf");
const debug = require("debug")("spdy:framer");
const debugExtra = require("debug")("spdy:framer:extra");

export default class Framer extends base.Framer {
    constructor(options) {
        super(options);

        this.maxFrameSize = constants.INITIAL_MAX_FRAME_SIZE;
    }

    setMaxFrameSize(size) {
        this.maxFrameSize = size;
    }

    _frame(frame, body, callback) {
        debug("id=%d type=%s", frame.id, frame.type);

        const buffer = new WriteBuffer();

        buffer.reserve(constants.FRAME_HEADER_SIZE);
        const len = buffer.skip(3);
        buffer.writeUInt8(constants.frameType[frame.type]);
        buffer.writeUInt8(frame.flags);
        buffer.writeUInt32BE(frame.id & 0x7fffffff);

        body(buffer);

        const frameSize = buffer.size - constants.FRAME_HEADER_SIZE;
        len.writeUInt24BE(frameSize);

        const chunks = buffer.render();
        const toWrite = {
            stream: frame.id,
            priority: is.undefined(frame.priority) ? false : frame.priority,
            chunks,
            callback
        };

        if (this.window && frame.type === "DATA") {
            const self = this;
            this._resetTimeout();
            this.window.send.update(-frameSize, () => {
                self._resetTimeout();
                self.schedule(toWrite);
            });
        } else {
            this._resetTimeout();
            this.schedule(toWrite);
        }

        return chunks;
    }

    _split(frame) {
        const buf = new OffsetBuffer();
        for (let i = 0; i < frame.chunks.length; i++) {
            buf.push(frame.chunks[i]);
        }

        const frames = [];
        while (!buf.isEmpty()) {
            // First frame may have reserved bytes in it
            let size = this.maxFrameSize;
            if (frames.length === 0) {
                size -= frame.reserve;
            }
            size = Math.min(size, buf.size);

            const frameBuf = buf.clone(size);
            buf.skip(size);

            frames.push({
                size: frameBuf.size,
                chunks: frameBuf.toChunks()
            });
        }

        return frames;
    }

    _continuationFrame(frame, body, callback) {
        const frames = this._split(frame);

        frames.forEach(function (subFrame, i) {
            const isFirst = i === 0;
            const isLast = i === frames.length - 1;

            let flags = isLast ? constants.flags.END_HEADERS : 0;

            // PRIORITY and friends
            if (isFirst) {
                flags |= frame.flags;
            }

            this._frame({
                id: frame.id,
                priority: false,
                type: isFirst ? frame.type : "CONTINUATION",
                flags
            }, (buf) => {
                // Fill those reserved bytes
                if (isFirst && body) {
                    body(buf);
                }

                buf.reserve(subFrame.size);
                for (let i = 0; i < subFrame.chunks.length; i++) {
                    buf.copyFrom(subFrame.chunks[i]);
                }
            }, isLast ? callback : null);
        }, this);

        if (frames.length === 0) {
            this._frame({
                id: frame.id,
                priority: false,
                type: frame.type,
                flags: frame.flags | constants.flags.END_HEADERS
            }, (buf) => {
                if (body) {
                    body(buf);
                }
            }, callback);
        }
    }

    _compressHeaders(headers, pairs, callback) {
        Object.keys(headers || {}).forEach((name) => {
            const lowName = name.toLowerCase();

            // Not allowed in HTTP2
            switch (lowName) {
                case "host":
                case "connection":
                case "keep-alive":
                case "proxy-connection":
                case "transfer-encoding":
                case "upgrade":
                    return;
            }

            // Should be in `pairs`
            if (/^:/.test(lowName)) {
                return;
            }

            // Do not compress, or index Cookie field (for security reasons)
            const neverIndex = lowName === "cookie" || lowName === "set-cookie";

            const value = headers[name];
            if (is.array(value)) {
                for (let i = 0; i < value.length; i++) {
                    pairs.push({
                        name: lowName,
                        value: `${value[i]}`,
                        neverIndex,
                        huffman: !neverIndex
                    });
                }
            } else {
                pairs.push({
                    name: lowName,
                    value: String(value),
                    neverIndex,
                    huffman: !neverIndex
                });
            }
        });

        assert(!is.null(this.compress), "Framer version not initialized");
        debugExtra("compressing headers=%j", pairs);
        this.compress.write([pairs], callback);
    }

    _isDefaultPriority(priority) {
        if (!priority) {
            return true;
        }

        return !priority.parent &&
            priority.weight === constants.DEFAULT &&
            !priority.exclusive;
    }

    _defaultHeaders(frame, pairs) {
        if (!frame.path) {
            throw new Error("`path` is required frame argument");
        }

        pairs.push({
            name: ":method",
            value: frame.method || base.constants.DEFAULT_METHOD
        });
        pairs.push({ name: ":path", value: frame.path });
        pairs.push({ name: ":scheme", value: frame.scheme || "https" });
        pairs.push({
            name: ":authority",
            value: frame.host ||
                (frame.headers && frame.headers.host) ||
                base.constants.DEFAULT_HOST
        });
    }

    _headersFrame(kind, frame, callback) {
        const pairs = [];

        if (kind === "request") {
            this._defaultHeaders(frame, pairs);
        } else if (kind === "response") {
            pairs.push({ name: ":status", value: `${frame.status || 200}` });
        }

        const self = this;
        this._compressHeaders(frame.headers, pairs, (err, chunks) => {
            if (err) {
                if (callback) {
                    return callback(err);
                }
                return self.emit("error", err);

            }

            let reserve = 0;

            // If priority info is present, and the values are not default ones
            // reserve space for the priority info and add PRIORITY flag
            const priority = frame.priority;
            if (!self._isDefaultPriority(priority)) {
                reserve = 5;
            }

            let flags = reserve === 0 ? 0 : constants.flags.PRIORITY;

            // Mostly for testing
            if (frame.fin) {
                flags |= constants.flags.END_STREAM;
            }

            self._continuationFrame({
                id: frame.id,
                type: "HEADERS",
                flags,
                reserve,
                chunks
            }, (buf) => {
                if (reserve === 0) {
                    return;
                }

                buf.writeUInt32BE(((priority.exclusive ? 0x80000000 : 0) |
                    priority.parent) >>> 0);
                buf.writeUInt8((priority.weight | 0) - 1);
            }, callback);
        });
    }

    requestFrame(frame, callback) {
        return this._headersFrame("request", frame, callback);
    }

    responseFrame(frame, callback) {
        return this._headersFrame("response", frame, callback);
    }

    headersFrame(frame, callback) {
        return this._headersFrame("headers", frame, callback);
    }

    pushFrame(frame, callback) {
        const self = this;

        const compress = function (headers, pairs, callback) {
            self._compressHeaders(headers, pairs, (err, chunks) => {
                if (err) {
                    if (callback) {
                        return callback(err);
                    }
                    return self.emit("error", err);

                }

                callback(chunks);
            });
        };

        const sendPromise = function (chunks) {
            self._continuationFrame({
                id: frame.id,
                type: "PUSH_PROMISE",
                reserve: 4,
                chunks
            }, (buf) => {
                buf.writeUInt32BE(frame.promisedId);
            });
        };

        const sendResponse = function (chunks, callback) {
            const priority = frame.priority;
            const isDefaultPriority = self._isDefaultPriority(priority);
            let flags = isDefaultPriority ? 0 : constants.flags.PRIORITY;

            // Mostly for testing
            if (frame.fin) {
                flags |= constants.flags.END_STREAM;
            }

            self._continuationFrame({
                id: frame.promisedId,
                type: "HEADERS",
                flags,
                reserve: isDefaultPriority ? 0 : 5,
                chunks
            }, (buf) => {
                if (isDefaultPriority) {
                    return;
                }

                buf.writeUInt32BE((priority.exclusive ? 0x80000000 : 0) |
                    priority.parent);
                buf.writeUInt8((priority.weight | 0) - 1);
            }, callback);
        };

        this._checkPush((err) => {
            if (err) {
                return callback(err);
            }

            const pairs = {
                promise: [],
                response: []
            };

            self._defaultHeaders(frame, pairs.promise);
            pairs.response.push({ name: ":status", value: `${frame.status || 200}` });

            compress(frame.headers, pairs.promise, (promiseChunks) => {
                sendPromise(promiseChunks);
                compress(frame.response, pairs.response, (responseChunks) => {
                    sendResponse(responseChunks, callback);
                });
            });
        });
    }

    priorityFrame(frame, callback) {
        this._frame({
            id: frame.id,
            priority: false,
            type: "PRIORITY",
            flags: 0
        }, (buf) => {
            const priority = frame.priority;
            buf.writeUInt32BE((priority.exclusive ? 0x80000000 : 0) |
                priority.parent);
            buf.writeUInt8((priority.weight | 0) - 1);
        }, callback);
    }

    dataFrame(frame, callback) {
        const frames = this._split({
            reserve: 0,
            chunks: [frame.data]
        });

        const fin = frame.fin ? constants.flags.END_STREAM : 0;

        const self = this;
        frames.forEach((subFrame, i) => {
            const isLast = i === frames.length - 1;
            let flags = 0;
            if (isLast) {
                flags |= fin;
            }

            self._frame({
                id: frame.id,
                priority: frame.priority,
                type: "DATA",
                flags
            }, (buf) => {
                buf.reserve(subFrame.size);
                for (let i = 0; i < subFrame.chunks.length; i++) {
                    buf.copyFrom(subFrame.chunks[i]);
                }
            }, isLast ? callback : null);
        });

        // Empty DATA
        if (frames.length === 0) {
            this._frame({
                id: frame.id,
                priority: frame.priority,
                type: "DATA",
                flags: fin
            }, (buf) => {
                // No-op
            }, callback);
        }
    }

    pingFrame(frame, callback) {
        this._frame({
            id: 0,
            type: "PING",
            flags: frame.ack ? constants.flags.ACK : 0
        }, (buf) => {
            buf.copyFrom(frame.opaque);
        }, callback);
    }

    rstFrame(frame, callback) {
        this._frame({
            id: frame.id,
            type: "RST_STREAM",
            flags: 0
        }, (buf) => {
            buf.writeUInt32BE(constants.error[frame.code]);
        }, callback);
    }

    prefaceFrame(callback) {
        debug("preface");
        this._resetTimeout();
        this.schedule({
            stream: 0,
            priority: false,
            chunks: [constants.PREFACE_BUFFER],
            callback
        });
    }

    settingsFrame(options, callback) {
        const key = JSON.stringify(options);

        const settings = Framer.settingsCache[key];
        if (settings) {
            debug("cached settings");
            this._resetTimeout();
            this.schedule({
                id: 0,
                priority: false,
                chunks: settings,
                callback
            });
            return;
        }

        const params = [];
        for (let i = 0; i < constants.settingsIndex.length; i++) {
            const name = constants.settingsIndex[i];
            if (!name) {
                continue;
            }

            // value: Infinity
            if (!isFinite(options[name])) {
                continue;
            }

            if (!is.undefined(options[name])) {
                params.push({ key: i, value: options[name] });
            }
        }

        const bodySize = params.length * 6;

        const chunks = this._frame({
            id: 0,
            type: "SETTINGS",
            flags: 0
        }, (buffer) => {
            buffer.reserve(bodySize);
            for (let i = 0; i < params.length; i++) {
                const param = params[i];

                buffer.writeUInt16BE(param.key);
                buffer.writeUInt32BE(param.value);
            }
        }, callback);

        Framer.settingsCache[key] = chunks;
    }

    ackSettingsFrame(callback) {
        /**
         * var chunks =
         */ this._frame({
            id: 0,
            type: "SETTINGS",
            flags: constants.flags.ACK
        }, (buffer) => {
            // No-op
        }, callback);
    }

    windowUpdateFrame(frame, callback) {
        this._frame({
            id: frame.id,
            type: "WINDOW_UPDATE",
            flags: 0
        }, (buffer) => {
            buffer.reserve(4);
            buffer.writeInt32BE(frame.delta);
        }, callback);
    }

    goawayFrame(frame, callback) {
        this._frame({
            type: "GOAWAY",
            id: 0,
            flags: 0
        }, (buf) => {
            buf.reserve(8);

            // Last-good-stream-ID
            buf.writeUInt32BE(frame.lastId & 0x7fffffff);
            // Code
            buf.writeUInt32BE(constants.goaway[frame.code]);

            // Extra debugging information
            if (frame.extra) {
                buf.write(frame.extra);
            }
        }, callback);
    }

    xForwardedFor(frame, callback) {
        this._frame({
            type: "X_FORWARDED_FOR",
            id: 0,
            flags: 0
        }, (buf) => {
            buf.write(frame.host);
        }, callback);
    }

    static create(options) {
        return new Framer(options);
    }
}
Framer.settingsCache = {};
