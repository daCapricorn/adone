const toPathComponents = require('./to-path-components')
const log = require('debug')('ipfs:mfs:utils:to-trail')

const {
    ipfs: { unixfsExporter: exporter },
    stream: { pull2: pull },
    multiformat: { CID }
} = adone;
const { collect, filter, map } = pull;

const toTrail = (context, path, options, callback) => {
    const toExport = toPathComponents(path)
        .slice(1)
    const finalPath = `/${toExport
        .slice(1)
        .join('/')}`

    let depth = 0

    log(`Creating trail for path ${path} ${toExport}`)

    let exported = ''

    pull(
        exporter(path, context.ipld, {
            fullPath: true,
            maxDepth: toExport.length - 1
        }),
        // find the directory from each level in the filesystem
        filter(node => {
            log(`Saw node ${node.name} for segment ${toExport[depth]} at depth ${node.depth}`)

            if (node.name === toExport[depth]) {
                depth++

                return true
            }

            return false
        }),
        // load DAGNode for the containing folder
        map((node) => {
            let currentPath = '/'
            let name = currentPath

            if (exported) {
                currentPath = `${exported === '/' ? '' : exported}/${toExport[node.depth]}`
                name = node.name
            }

            exported = currentPath

            if (exported !== finalPath && node.type !== 'dir') {
                throw new Error(`cannot access ${exported}: Not a directory ${finalPath}`)
            }

            return {
                name,
                cid: new CID(node.hash),
                size: node.size,
                type: node.type
            }
        }),
        collect(callback)
    )
}

module.exports = toTrail
