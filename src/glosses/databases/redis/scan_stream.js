

/**
 * Convenient class to convert the process of scaning keys to a readable stream.
 *
 * @constructor
 * @private
 */
export default class ScanStream extends adone.std.stream.Readable {
    constructor(opt) {
        super(opt);
        this._redisCursor = "0";
        this.opt = opt;
    }

    _read() {
        if (this._redisDrained) {
            this.push(null);
            return;
        }
        const args = [this._redisCursor];
        if (this.opt.key) {
            args.unshift(this.opt.key);
        }
        if (this.opt.match) {
            args.push("MATCH", this.opt.match);
        }
        if (this.opt.count) {
            args.push("COUNT", this.opt.count);
        }
        this.opt.redis[this.opt.command](args, (err, res) => {
            if (err) {
                this.emit("error", err);
                return;
            }
            this._redisCursor = adone.is.buffer(res[0]) ? res[0].toString() : res[0];
            if (this._redisCursor === "0") {
                this._redisDrained = true;
            }
            this.push(res[1]);
        });
    }

    close() {
        this._redisDrained = true;
    }
}

