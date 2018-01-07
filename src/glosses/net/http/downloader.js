const {
    net: { http },
    fs,
    is,
    stream,
    x,
    std
} = adone;

/**
 * Download helper
 */
export default class Downlader extends adone.event.EventEmitter {
    constructor({
        url,
        dest
    }) {
        super();

        this.url = url;
        if (!is.string(dest) && !is.writableStream(dest)) {
            throw new x.InvalidArgument("dest must be a string or writable stream");
        }
        this.dest = dest;
    }

    /**
     * Returns a destination stream to write the downloaded contents to
     */
    async _createDestStream() {
        let { dest } = this;

        if (is.writableStream(dest)) {
            return dest;
        }

        // string - path
        dest = std.path.resolve(dest);
        const dirname = std.path.dirname(dest);
        await fs.mkdirp(dirname); // ensure the directory exists
        return fs.createWriteStream(dest);
    }

    /**
     * Returns a stream that handles the number of transmitted bytes
     */
    _createCounterStream(totalLength) {
        let transmitted = 0;
        return stream.through.base((chunk, enc, cb) => {
            if (transmitted === 0) {
                // initial event
                this.emit("bytes", transmitted, totalLength);
            }
            transmitted += chunk.length;
            this.emit("bytes", transmitted, totalLength);
            cb(null, chunk);
        });
    }

    async download() {
        const res = await http.client.request(this.url, {
            responseType: "stream"
        });
        const totalLength = Number(res.headers["content-length"]) || null;

        const destStream = await this._createDestStream();

        const counter = this._createCounterStream(totalLength);

        // TODO: close streams if errors?
        await new Promise((resolve, reject) => {
            res.data.pipe(counter).pipe(destStream);
            res.data.once("error", reject);
            destStream.once("error", reject).once("finish", resolve);
        });
    }

    then(onResolve, onReject) {
        return this.download(onResolve, onReject);
    }

    catch(onReject) {
        return this.then(null, onReject);
    }
}