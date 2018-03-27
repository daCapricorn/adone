const series = require("async/series");

const {
    is,
    crypto: { Identity },
    net: { p2p: { Connection, PeerInfo } }
} = adone;

const __ = adone.private(adone.net.p2p.circuit);


const peerIdFromId = function (id) {
    if (is.string(id)) {
        return Identity.createFromB58String(id);
    }

    return Identity.createFromBytes(id);
};

export default class Stop extends adone.event.Emitter {
    constructor(sw) {
        super();
        this.switch = sw;
        this.utils = __.utils(sw);
    }

    handle(message, streamHandler, callback) {
        callback = callback || (() => { });

        series([
            (cb) => this.utils.validateAddrs(message, streamHandler, __.protocol.CircuitRelay.Type.STOP, cb),
            (cb) => this.utils.writeResponse(streamHandler, __.protocol.CircuitRelay.Status.Success, cb)
        ], (err) => {
            if (err) {
                callback(); // we don't return the error here, since multistream select don't expect one
                return;
            }

            const peerInfo = new PeerInfo(peerIdFromId(message.srcPeer.id));
            message.srcPeer.addrs.forEach((addr) => peerInfo.multiaddrs.add(addr));
            const newConn = new Connection(streamHandler.rest());
            newConn.setPeerInfo(peerInfo);
            setImmediate(() => this.emit("connection", newConn));
            callback(newConn);
        });
    }
}
