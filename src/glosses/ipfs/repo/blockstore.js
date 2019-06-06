const base32 = require('base32.js')
const pull = require('pull-stream')

const {
    async: { setImmediate, reject },
    ipfs: { Block },
    datastore: { shard: sh, ShardingDatastore, interface: { Key } },
    multiformat: { CID }
} = adone;


/**
 * Transform a raw buffer to a base32 encoded key.
 *
 * @param {Buffer} rawKey
 * @returns {Key}
 */
const keyFromBuffer = (rawKey) => {
    const enc = new base32.Encoder()
    return new Key('/' + enc.write(rawKey).finalize(), false)
}

/**
 * Transform a cid to the appropriate datastore key.
 *
 * @param {CID} cid
 * @returns {Key}
 */
const cidToDsKey = (cid) => {
    return keyFromBuffer(cid.buffer)
}

module.exports = (filestore, options, callback) => {
    maybeWithSharding(filestore, options, (err, store) => {
        if (err) { return callback(err) }

        callback(null, createBaseStore(store))
    })
}

function maybeWithSharding(filestore, options, callback) {
    if (options.sharding) {
        const shard = new sh.NextToLast(2)
        ShardingDatastore.createOrOpen(filestore, shard, callback)
    } else {
        setImmediate(() => callback(null, filestore))
    }
}

function createBaseStore(store) {
    return {
        /**
         * Query the store.
         *
         * @param {object} query
         * @param {function(Error, Array)} callback
         * @return {void}
         */
        query(query, callback) {
            pull(
                store.query(query),
                pull.collect(callback)
            )
        },
        /**
         * Get a single block by CID.
         *
         * @param {CID} cid
         * @param {function(Error, Block)} callback
         * @returns {void}
         */
        get(cid, callback) {
            if (!CID.isCID(cid)) {
                return setImmediate(() => {
                    callback(new Error('Not a valid cid'))
                })
            }

            const key = cidToDsKey(cid)
            store.get(key, (err, blockData) => {
                if (err) {
                    // If not found, we try with the other CID version.
                    // If exists, then store that block under the CID that was requested.
                    // Some duplication occurs.
                    if (err.code === 'ERR_NOT_FOUND') {
                        const otherCid = cidToOtherVersion(cid)
                        if (!otherCid) return callback(err)

                        const otherKey = cidToDsKey(otherCid)
                        return store.get(otherKey, (err, blockData) => {
                            if (err) return callback(err)

                            store.put(key, blockData, (err) => {
                                if (err) return callback(err)
                                callback(null, new Block(blockData, cid))
                            })
                        })
                    }

                    return callback(err)
                }

                callback(null, new Block(blockData, cid))
            })
        },
        put(block, callback) {
            if (!Block.isBlock(block)) {
                return setImmediate(() => {
                    callback(new Error('invalid block'))
                })
            }

            const k = cidToDsKey(block.cid)

            store.has(k, (err, exists) => {
                if (err) { return callback(err) }
                if (exists) { return callback() }

                store.put(k, block.data, callback)
            })
        },
        /**
         * Like put, but for more.
         *
         * @param {Array<Block>} blocks
         * @param {function(Error)} callback
         * @returns {void}
         */
        putMany(blocks, callback) {
            const keys = blocks.map((b) => ({
                key: cidToDsKey(b.cid),
                block: b
            }))

            const batch = store.batch()
            reject(keys, (k, cb) => store.has(k.key, cb), (err, newKeys) => {
                if (err) {
                    return callback(err)
                }

                newKeys.forEach((k) => {
                    batch.put(k.key, k.block.data)
                })

                batch.commit(callback)
            })
        },
        /**
         * Does the store contain block with this cid?
         *
         * @param {CID} cid
         * @param {function(Error, bool)} callback
         * @returns {void}
         */
        has(cid, callback) {
            if (!CID.isCID(cid)) {
                return setImmediate(() => {
                    callback(new Error('Not a valid cid'))
                })
            }

            store.has(cidToDsKey(cid), (err, exists) => {
                if (err) return callback(err)
                if (exists) return callback(null, true)

                // If not found, we try with the other CID version.
                const otherCid = cidToOtherVersion(cid)
                if (!otherCid) return callback(null, false)

                store.has(cidToDsKey(otherCid), callback)
            })
        },
        /**
         * Delete a block from the store
         *
         * @param {CID} cid
         * @param {function(Error)} callback
         * @returns {void}
         */
        delete(cid, callback) {
            if (!CID.isCID(cid)) {
                return setImmediate(() => {
                    callback(new Error('Not a valid cid'))
                })
            }

            store.delete(cidToDsKey(cid), callback)
        },

        close(callback) {
            store.close(callback)
        }
    }
}

function cidToOtherVersion(cid) {
    try {
        return cid.version === 0 ? cid.toV1() : cid.toV0()
    } catch (err) {
        return null
    }
}
