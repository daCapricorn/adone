const SendFilesStream = require('../utils/send-files-stream')
const FileResultStreamConverter = require('../utils/file-result-stream-converter')

const {
    p2p: { stream: { streamToPullStream } }
} = adone;

module.exports = (send) => {
    return (options) => {
        options = options || {}
        options.converter = FileResultStreamConverter
        return streamToPullStream(SendFilesStream(send, 'add')({ qs: options }))
    }
}
