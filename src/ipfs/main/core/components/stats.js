const promisify = require('promisify-es6')
const Big = require('bignumber.js')
const human = require('human-to-milliseconds')
const errCode = require('err-code')

const {
    stream: { pull2: pull }
} = adone;
const { pullStreamToStream: toStream, pushable: Pushable } = pull;

function bandwidthStats(self, opts) {
    return new Promise((resolve, reject) => {
        let stats

        if (opts.peer) {
            stats = self.libp2p.stats.forPeer(opts.peer)
        } else if (opts.proto) {
            stats = self.libp2p.stats.forProtocol(opts.proto)
        } else {
            stats = self.libp2p.stats.global
        }

        if (!stats) {
            resolve({
                totalIn: new Big(0),
                totalOut: new Big(0),
                rateIn: new Big(0),
                rateOut: new Big(0)
            })
            return
        }

        resolve({
            totalIn: stats.snapshot.dataReceived,
            totalOut: stats.snapshot.dataSent,
            rateIn: new Big(stats.movingAverages.dataReceived['60000'].movingAverage() / 60),
            rateOut: new Big(stats.movingAverages.dataSent['60000'].movingAverage() / 60)
        })
    })
}

module.exports = function stats(self) {
    const _bwPullStream = (opts) => {
        opts = opts || {}
        let interval = null
        let stream = Pushable(true, () => {
            if (interval) {
                clearInterval(interval)
            }
        })

        if (opts.poll) {
            human(opts.interval || '1s', (err, value) => {
                if (err) {
                    return stream.end(errCode(err, 'ERR_INVALID_POLL_INTERVAL'))
                }

                interval = setInterval(() => {
                    bandwidthStats(self, opts)
                        .then((stats) => stream.push(stats))
                        .catch((err) => stream.end(err))
                }, value)
            })
        } else {
            bandwidthStats(self, opts)
                .then((stats) => {
                    stream.push(stats)
                    stream.end()
                })
                .catch((err) => stream.end(err))
        }

        return stream.source
    }

    return {
        bitswap: require('./bitswap')(self).stat,
        repo: require('./repo')(self).stat,
        bw: promisify((opts, callback) => {
            if (typeof opts === 'function') {
                callback = opts
                opts = {}
            }

            opts = opts || {}

            bandwidthStats(self, opts)
                .then((stats) => callback(null, stats))
                .catch((err) => callback(err))
        }),
        bwReadableStream: (opts) => toStream.source(_bwPullStream(opts)),
        bwPullStream: _bwPullStream
    }
}
