const cbor = require('borc')
const isCircular = require('is-circular')

const resolver = require('./resolver')

const {
    multiformat: { CID, multihashingAsync: multihashing }
} = adone;


// https://github.com/ipfs/go-ipfs/issues/3570#issuecomment-273931692
const CID_CBOR_TAG = 42

function tagCID(cid) {
    if (typeof cid === 'string') {
        cid = new CID(cid).buffer
    } else if (CID.isCID(cid)) {
        cid = cid.buffer
    }

    return new cbor.Tagged(CID_CBOR_TAG, Buffer.concat([
        Buffer.from('00', 'hex'), // thanks jdag
        cid
    ]))
}

function replaceCIDbyTAG(dagNode) {
    let circular
    try {
        circular = isCircular(dagNode)
    } catch (e) {
        circular = false
    }
    if (circular) {
        throw new Error('The object passed has circular references')
    }

    function transform(obj) {
        if (!obj || Buffer.isBuffer(obj) || typeof obj === 'string') {
            return obj
        }

        if (Array.isArray(obj)) {
            return obj.map(transform)
        }

        if (CID.isCID(obj)) {
            return tagCID(obj)
        }

        const keys = Object.keys(obj)

        if (keys.length === 1 && keys[0] === '/') {
            // Multiaddr encoding
            // if (typeof link === 'string' && isMultiaddr(link)) {
            //  link = new Multiaddr(link).buffer
            // }

            return tagCID(obj['/'])
        } else if (keys.length > 0) {
            // Recursive transform
            const out = {}
            keys.forEach((key) => {
                if (typeof obj[key] === 'object') {
                    out[key] = transform(obj[key])
                } else {
                    out[key] = obj[key]
                }
            })
            return out
        } else {
            return obj
        }
    }

    return transform(dagNode)
}

exports = module.exports

let decoder = null

exports.configureDecoder = (opts) => {
    opts = opts || {}
    decoder = new cbor.Decoder({
        tags: Object.assign({
            [CID_CBOR_TAG]: (val) => {
                // remove that 0
                val = val.slice(1)
                return new CID(val)
            }
        }, opts.tags || {}),
        size: opts.size
    })
}

exports.configureDecoder() // Setup default cbor.Decoder

exports.serialize = (dagNode, callback) => {
    let serialized

    try {
        const dagNodeTagged = replaceCIDbyTAG(dagNode)
        serialized = cbor.encode(dagNodeTagged)
    } catch (err) {
        return setImmediate(() => callback(err))
    }
    setImmediate(() => callback(null, serialized))
}

exports.deserialize = (data, callback) => {
    let deserialized

    try {
        deserialized = decoder.decodeFirst(data)
    } catch (err) {
        return setImmediate(() => callback(err))
    }

    setImmediate(() => callback(null, deserialized))
}

/**
 * @callback CidCallback
 * @param {?Error} error - Error if getting the CID failed
 * @param {?CID} cid - CID if call was successful
 */
/**
 * Get the CID of the DAG-Node.
 *
 * @param {Object} dagNode - Internal representation
 * @param {Object} [options] - Options to create the CID
 * @param {number} [options.version=1] - CID version number
 * @param {string} [options.hashAlg] - Defaults to hashAlg for the resolver
 * @param {number} [options.hashLen] - Optionally trim the digest to this length
 * @param {CidCallback} callback - Callback that handles the return value
 * @returns {void}
 */
exports.cid = (dagNode, options, callback) => {
    if (typeof options === 'function') {
        callback = options
        options = {}
    }
    options = options || {}
    const hashAlg = options.hashAlg || resolver.defaultHashAlg
    const hashLen = options.hashLen
    const version = typeof options.version === 'undefined' ? 1 : options.version

    exports.serialize(dagNode, (err, serialized) => {
        if (err) return callback(err)
        multihashing(serialized, hashAlg, hashLen, (err, mh) => {
            if (err) return callback(err)
            callback(null, new CID(version, resolver.multicodec, mh))
        })
    })
}
