const each = require("async/each");

const {
    is,
    datastore2: { KeyTransformDatastore, interface: { Key, error, util: { asyncFilter, asyncSort, replaceStartWith } } },
    stream: { pull2: pull }
} = adone;
const { many } = pull;

/**
 * ::
 * import type {Datastore, Callback, Batch, Query, QueryResult} from 'interface-datastore'
 *
 * type Mount<Value> = {
 * prefix: Key,
 * datastore: Datastore<Value>
 * }
 */

/**
 * A datastore that can combine multiple stores inside various
 * key prefixs.
 */
export default class MountDatastore /* :: <Value> */ {
    /**
     * :: mounts: Array<Mount<Value>>
     */

    constructor(mounts /* : Array<Mount<Value>> */) {
        this.mounts = mounts.slice();
    }

    open(callback /* : Callback<void> */) /* : void */ {
        each(this.mounts, (m, cb) => {
            m.datastore.open(cb);
        }, callback);
    }

    /**
     * Lookup the matching datastore for the given key.
     *
     * @private
     * @param {Key} key
     * @returns {{Datastore, Key, Key}}
     */
    _lookup(key /* : Key */) /* : ?{datastore: Datastore<Value>, mountpoint: Key, rest: Key} */ {
        for (const mount of this.mounts) {
            if (mount.prefix.toString() === key.toString() || mount.prefix.isAncestorOf(key)) {
                const s = replaceStartWith(key.toString(), mount.prefix.toString());
                return {
                    datastore: mount.datastore,
                    mountpoint: mount.prefix,
                    rest: new Key(s)
                };
            }
        }
    }

    put(key /* : Key */, value /* : Value */, callback /* : Callback<void> */) /* : void */ {
        const match = this._lookup(key);
        if (is.nil(match)) {
            return callback(
                error.dbWriteFailedError(new Error("No datastore mounted for this key"))
            );
        }

        match.datastore.put(match.rest, value, callback);
    }

    get(key /* : Key */, callback /* : Callback<Value> */) /* : void */ {
        const match = this._lookup(key);
        if (is.nil(match)) {
            return callback(
                error.notFoundError(new Error("No datastore mounted for this key"))
            );
        }

        match.datastore.get(match.rest, callback);
    }

    has(key /* : Key */, callback /* : Callback<bool> */) /* : void */ {
        const match = this._lookup(key);
        if (is.nil(match)) {
            callback(null, false);
            return;
        }

        match.datastore.has(match.rest, callback);
    }

    delete(key /* : Key */, callback /* : Callback<void> */) /* : void */ {
        const match = this._lookup(key);
        if (is.nil(match)) {
            return callback(
                error.dbDeleteFailedError(new Error("No datastore mounted for this key"))
            );
        }

        match.datastore.delete(match.rest, callback);
    }

    close(callback /* : Callback<void> */) /* : void */ {
        each(this.mounts, (m, cb) => {
            m.datastore.close(cb);
        }, callback);
    }

    batch() /* : Batch<Value> */ {
        const batchMounts = {};
        const lookup = (key /* : Key */) /* : {batch: Batch<Value>, rest: Key} */ => {
            const match = this._lookup(key);
            if (is.nil(match)) {
                throw new Error("No datastore mounted for this key");
            }

            const m = match.mountpoint.toString();
            if (is.nil(batchMounts[m])) {
                batchMounts[m] = match.datastore.batch();
            }

            return {
                batch: batchMounts[m],
                rest: match.rest
            };
        };

        return {
            put: (key /* : Key */, value /* : Value */) /* : void */ => {
                const match = lookup(key);
                match.batch.put(match.rest, value);
            },
            delete: (key /* : Key */) /* : void */ => {
                const match = lookup(key);
                match.batch.delete(match.rest);
            },
            commit: (callback /* : Callback<void> */) /* : void */ => {
                each(Object.keys(batchMounts), (p, cb) => {
                    batchMounts[p].commit(cb);
                }, callback);
            }
        };
    }

    query(q /* : Query<Value> */) /* : QueryResult<Value> */ {
        const qs = this.mounts.map((m) => {
            const ks = new KeyTransformDatastore(m.datastore, {
                convert: (key /* : Key */) /* : Key */ => {
                    throw new Error("should never be called");
                },
                invert: (key /* : Key */) /* : Key */ => {
                    return m.prefix.child(key);
                }
            });

            let prefix;
            if (!is.nil(q.prefix)) {
                prefix = replaceStartWith(q.prefix, m.prefix.toString());
            }

            return ks.query({
                prefix,
                filters: q.filters,
                keysOnly: q.keysOnly
            });
        });

        let tasks = [many(qs)];

        if (!is.nil(q.filters)) {
            tasks = tasks.concat(q.filters.map((f) => asyncFilter(f)));
        }

        if (!is.nil(q.orders)) {
            tasks = tasks.concat(q.orders.map((o) => asyncSort(o)));
        }

        if (!is.nil(q.offset)) {
            let i = 0;
            tasks.push(pull.filter(() => i++ >= q.offset));
        }

        if (!is.nil(q.limit)) {
            tasks.push(pull.take(q.limit));
        }

        return pull.apply(null, tasks);
    }
}
