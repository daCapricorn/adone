const bs58 = require('bs58')

const {
    ipfs: { isIPFS },
    multiformat: { CID }
} = adone;

module.exports = function (multihash) {
    if (Buffer.isBuffer(multihash)) {
        multihash = bs58.encode(multihash)
    }
    if (CID.isCID(multihash)) {
        multihash = multihash.toBaseEncodedString()
    }
    if (typeof multihash !== 'string') {
        throw new Error('unexpected multihash type: ' + typeof multihash)
    }
    if (!isIPFS.multihash(multihash.split('/')[0])) {
        throw new Error('not valid multihash')
    }
    return multihash
}
