const {
    is,
    error,
    std,
    util
} = adone;
const {
    path
} = std;

const removeTrailingSep = (str) => {
    let i = str.length - 1;
    if (i < 2) {
        return str;
    }
    const sep = std.path.sep;
    while (i > 0 && str[i] === sep) {
        i--;
    }
    return str.substr(0, i + 1);
};

const cloneStat = (stat) => {
    const stub = new std.fs.Stats();
    for (const key of util.keys(stat)) {
        stub[key] = stat[key];
    }
    return stub;
};

const builtInProps = new Set(["contents", "stat", "history", "path", "base", "cwd", "_"]);

export default class File {
    constructor({
        contents = null,
        stat = null,
        path = null,
        cwd = process.cwd(),
        base = cwd,
        symlink = null,
        history = []
    } = {}) {
        this._ = new Map([
            ["contents", contents]
        ]);
        this.symlink = symlink;
        this.cwd = cwd;
        this.base = base;
        this.stat = stat;
        this.history = [];
        if (path) {
            history.push(path);
        }
        for (const p of history) {
            this.path = p;
        }
    }

    static isCustomProp(key) {
        return !builtInProps.has(key);
    }

    get contents() {
        return this._.get("contents");
    }

    set contents(value) {
        if (is.string(value)) {
            value = Buffer.from(value);
        }
        if (!is.null(value) && !is.buffer(value) && !is.stream(value)) {
            throw new error.Exception("Invalid contents value");
        }
        this._.set("contents", value);
    }

    clone({ contents = false, deep = true } = {}) {
        if (contents) {
            if (this.isStream()) {
                throw new error.NotSupportedException("You cannot clone a stream yet");
            } else if (this.isBuffer()) {
                contents = Buffer.from(this.contents);
            } else {
                contents = null;
            }
        }
        const file = new this.constructor({
            cwd: this.cwd,
            base: this.base,
            stat: this.stat ? cloneStat(this.stat) : null,
            history: this.history.slice(),
            contents
        });
        for (const prop of Object.keys(this)) {
            if (this.constructor.isCustomProp(prop)) {
                file[prop] = deep ? adone.lodash.cloneDeep(this[prop]) : this[prop];
            }
        }
        return file;
    }

    isBuffer() {
        return is.buffer(this.contents);
    }

    isStream() {
        return is.stream(this.contents);
    }

    isNull() {
        return is.null(this.contents);
    }

    isDirectory() {
        return Boolean(this.isNull() && this.stat && this.stat.isDirectory());
    }

    isSymbolic() {
        return Boolean(this.isNull() && this.stat && this.stat.isSymbolicLink());
    }

    get cwd() {
        return this._.get("cwd");
    }

    set cwd(value) {
        if (!value || !is.string(value)) {
            throw new error.Exception("Invalid value");
        }
        this._.set("cwd", removeTrailingSep(path.normalize(value)));
    }

    get base() {
        return this._.get("base") || this.cwd;
    }

    set base(value) {
        if (is.null(value)) {
            this._.delete("base");
            return;
        }
        if (!is.string(value) || !value) {
            throw new error.Exception("Invalid value");
        }
        const base = removeTrailingSep(path.normalize(value));
        if (base !== this.cwd) {
            this._.set("base", base);
        } else {
            this._.delete("base");
        }
    }

    get path() {
        return this.history[this.history.length - 1];
    }

    set path(value) {
        value = removeTrailingSep(path.normalize(value));
        if (value && value !== this.path) {
            this.history.push(value);
        }
    }

    get relative() {
        const { path } = this;
        if (!path) {
            throw new error.Exception("No path - no relative path");
        }
        return std.path.relative(this.base, path);
    }

    set relative(newRelative) {
        this.path = std.path.join(this.base, newRelative);
    }

    get dirname() {
        const { path } = this;
        if (!path) {
            throw new error.Exception("No path - no dirname");
        }
        return std.path.dirname(path);
    }

    set dirname(dirname) {
        this.path = path.join(dirname, this.basename);
    }

    get basename() {
        const { path } = this;
        if (!path) {
            throw new error.Exception("No path - no basename");
        }
        return std.path.basename(path);
    }

    set basename(value) {
        const { path } = this;
        if (!path) {
            throw new error.Exception("No path - no ability to set the basename");
        }
        this.path = std.path.join(this.dirname, value);
    }

    get extname() {
        const { path } = this;
        if (!path) {
            throw new error.Exception("No path - no extname");
        }
        return std.path.extname(path);
    }

    set extname(value) {
        const { path } = this;
        if (!path) {
            throw new error.Exception("No path - no ability to set the extname");
        }
        const t = std.path.basename(path, std.path.extname(path)) + value;
        this.path = std.path.join(this.dirname, t);
    }

    get stem() {
        const { path } = this;
        if (!path) {
            throw new error.Exception("No path - no stem");
        }
        return std.path.basename(this.path, this.extname);
    }

    set stem(value) {
        const { path } = this;
        if (!path) {
            throw new error.Exception("No path - no ability to set the stem");
        }
        this.path = std.path.join(this.dirname, value + this.extname);
    }

    get symlink() {
        return this._.get("symlink");
    }

    set symlink(value) {
        this._.set("symlink", value);
    }
}
