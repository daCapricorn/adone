const waterfall = require('async/waterfall')
const {
    loadNode,
    formatCid,
    toMfsPath,
    FILE_SEPARATOR,
    FILE_TYPES
} = require('./utils')

const {
    ipfs: { UnixFs, unixfsExporter: exporter }
} = adone;

const {
    stream: { pull2: pull }
} = adone;
const { defer, collect, asyncMap, once, error, filter } = pull;

const defaultOptions = {
    long: false,
    cidBase: 'base58btc'
}

module.exports = (context) => {
    return function mfsLs(path, options = {}) {
        if (typeof path === 'object') {
            options = path
            path = FILE_SEPARATOR
        }

        if (path === undefined) {
            path = FILE_SEPARATOR
        }

        options = Object.assign({}, defaultOptions, options)

        options.long = options.l || options.long

        const deferred = defer.source()

        waterfall([
            (cb) => toMfsPath(context, path, cb),
            ({ mfsPath, depth }, cb) => {
                pull(
                    exporter(mfsPath, context.ipld, {
                        maxDepth: depth
                    }),

                    collect((err, files) => {
                        if (err) {
                            return cb(err)
                        }

                        if (files.length > 1) {
                            return cb(new Error(`Path ${path} had ${files.length} roots`))
                        }

                        const file = files[0]

                        if (!file) {
                            return cb(new Error(`${path} does not exist`))
                        }

                        if (file.type !== 'dir') {
                            return cb(null, once(file))
                        }

                        let first = true

                        return cb(null, pull(
                            exporter(mfsPath, context.ipld, {
                                maxDepth: depth + 1
                            }),
                            // first item in list is the directory node
                            filter(() => {
                                if (first) {
                                    first = false
                                    return false
                                }

                                return true
                            })
                        ))
                    })
                )
            },
            (source, cb) => {
                cb(null,
                    pull(
                        source,

                        // load DAGNodes for each file
                        asyncMap((file, cb) => {
                            if (!options.long) {
                                return cb(null, {
                                    name: file.name,
                                    type: 0,
                                    size: 0,
                                    hash: ''
                                })
                            }

                            loadNode(context, {
                                cid: file.hash
                            }, (err, result) => {
                                if (err) {
                                    return cb(err)
                                }

                                const meta = UnixFs.unmarshal(result.node.data)

                                cb(null, {
                                    name: file.name,
                                    type: FILE_TYPES[meta.type],
                                    hash: formatCid(file.hash, options.cidBase),
                                    size: meta.fileSize() || 0
                                })
                            })
                        })
                    )
                )
            }
        ], (err, source) => {
            if (err) {
                return deferred.resolve(error(err))
            }

            deferred.resolve(source)
        })

        return deferred
    }
}