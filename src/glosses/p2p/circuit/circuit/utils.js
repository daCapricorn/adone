const proto = require("../protocol");

const {
    is,
    multiformat: { multiaddr },
    p2p: { PeerId, PeerInfo }
} = adone;

module.exports = function (swarm) {
    /**
     * Get b58 string from multiaddr or peerinfo
     *
     * @param {Multiaddr|PeerInfo} peer
     * @return {*}
     */
    const getB58String = function (peer) {
        let b58Id = null;
        if (multiaddr.isMultiaddr(peer)) {
            const relayMa = multiaddr(peer);
            b58Id = relayMa.getPeerId();
        } else if (PeerInfo.isPeerInfo(peer)) {
            b58Id = peer.id.toB58String();
        }

        return b58Id;
    };

    /**
     * Helper to make a peer info from a multiaddrs
     *
     * @param {Multiaddr|PeerInfo|PeerId} ma
     * @param {Swarm} swarm
     * @return {PeerInfo}
     * @private
     */
    // TODO: this is ripped off of libp2p, should probably be a generally available util function
    const peerInfoFromMa = function (peer) {
        let p;
        // PeerInfo
        if (PeerInfo.isPeerInfo(peer)) {
            p = peer;
            // Multiaddr instance (not string)
        } else if (multiaddr.isMultiaddr(peer)) {
            const peerIdB58Str = peer.getPeerId();
            try {
                p = swarm._peerBook.get(peerIdB58Str);
            } catch (err) {
                p = new PeerInfo(PeerId.createFromB58String(peerIdB58Str));
            }
            p.multiaddrs.add(peer);
            // PeerId
        } else if (PeerId.isPeerId(peer)) {
            const peerIdB58Str = peer.toB58String();
            p = swarm._peerBook.has(peerIdB58Str) ? swarm._peerBook.get(peerIdB58Str) : peer;
        }

        return p;
    };

    /**
     * Checks if peer has an existing connection
     *
     * @param {String} peerId
     * @param {Swarm} swarm
     * @return {Boolean}
     */
    const isPeerConnected = (peerId) => swarm.muxedConns[peerId] || swarm.conns[peerId];

    /**
     * Write a response
     *
     * @param {StreamHandler} streamHandler
     * @param {CircuitRelay.Status} status
     * @param {Function} cb
     * @returns {*}
     */
    const writeResponse = function (streamHandler, status, cb) {
        cb = cb || (() => { });
        streamHandler.write(proto.CircuitRelay.encode({
            type: proto.CircuitRelay.Type.STATUS,
            code: status
        }));
        return cb();
    };

    /**
     * Validate incomming HOP/STOP message
     *
     * @param {CircuitRelay} msg
     * @param {StreamHandler} streamHandler
     * @param {CircuitRelay.Type} type
     * @returns {*}
     * @param {Function} cb
     */
    const validateAddrs = function (msg, streamHandler, type, cb) {
        try {
            msg.dstPeer.addrs.forEach((addr) => {
                return multiaddr(addr);
            });
        } catch (err) {
            writeResponse(streamHandler, type === proto.CircuitRelay.Type.HOP
                ? proto.CircuitRelay.Status.HOP_DST_MULTIADDR_INVALID
                : proto.CircuitRelay.Status.STOP_DST_MULTIADDR_INVALID);
            return cb(err);
        }

        try {
            msg.srcPeer.addrs.forEach((addr) => {
                return multiaddr(addr);
            });
        } catch (err) {
            writeResponse(streamHandler, type === proto.CircuitRelay.Type.HOP
                ? proto.CircuitRelay.Status.HOP_SRC_MULTIADDR_INVALID
                : proto.CircuitRelay.Status.STOP_SRC_MULTIADDR_INVALID);
            return cb(err);
        }

        return cb(null);
    };

    const peerIdFromId = function (id) {
        if (is.string(id)) {
            return PeerId.createFromB58String(id);
        }

        return PeerId.createFromBytes(id);
    };

    return {
        getB58String,
        peerInfoFromMa,
        isPeerConnected,
        validateAddrs,
        writeResponse,
        peerIdFromId
    };
};
