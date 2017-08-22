const addOperation = function (type, key, value, options) {
    const operation = {
        type,
        key,
        value,
        options
    };

    if (options && options.prefix) {
        operation.prefix = options.prefix;
        delete options.prefix;
    }

    this._operations.push(operation);

    return this;
};

export default class Batch {
    constructor(sdb) {
        this._operations = [];
        this._sdb = sdb;

        this.put = addOperation.bind(this, "put");
        this.del = addOperation.bind(this, "del");
    }

    clear() {
        this._operations = [];
    }

    write(cb) {
        this._sdb.batch(this._operations, cb);
    }
}
