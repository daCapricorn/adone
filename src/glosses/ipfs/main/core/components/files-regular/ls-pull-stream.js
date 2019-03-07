const { normalizePath } = require('./utils')

const {
    ipfs: { unixfsExporter: exporter },
    multiformat: { CID },
    stream: { pull2: pull }
} = adone;

module.exports = function (self) {
    return function (ipfsPath, options) {
        options = options || {}

        const path = normalizePath(ipfsPath)
        const recursive = options.recursive
        const pathComponents = path.split('/')
        const pathDepth = pathComponents.length
        const maxDepth = recursive ? global.Infinity : pathDepth
        options.maxDepth = options.maxDepth || maxDepth

        if (options.preload !== false) {
            self._preload(pathComponents[0])
        }

        return pull(
            exporter(ipfsPath, self._ipld, options),
            pull.filter(node =>
                recursive ? node.depth >= pathDepth : node.depth === pathDepth
            ),
            pull.map(node => {
                node.hash = new CID(node.hash).toBaseEncodedString()
                delete node.content
                return node
            })
        )
    }
}
