const multiaddr = require("multiaddr");
const errCode = require("err-code");

const {
    is,
    p2p: { PeerId, PeerInfo }
} = adone;

module.exports = (node) => {
    /*
     * Helper method to check the data type of peer and convert it to PeerInfo
     */
    return function (peer, callback) {
        let p;
        // PeerInfo
        if (PeerInfo.isPeerInfo(peer)) {
            p = peer;
            // Multiaddr instance or Multiaddr String
        } else if (multiaddr.isMultiaddr(peer) || is.string(peer)) {
            if (is.string(peer)) {
                try {
                    peer = multiaddr(peer);
                } catch (err) {
                    return callback(
                        errCode(err, "ERR_INVALID_MULTIADDR")
                    );
                }
            }

            const peerIdB58Str = peer.getPeerId();

            if (!peerIdB58Str) {
                return callback(
                    errCode(
                        new Error("peer multiaddr instance or string must include peerId"),
                        "ERR_INVALID_MULTIADDR"
                    )
                );
            }

            try {
                p = node.peerBook.get(peerIdB58Str);
            } catch (err) {
                p = new PeerInfo(PeerId.createFromB58String(peerIdB58Str));
            }
            p.multiaddrs.add(peer);

            // PeerId
        } else if (PeerId.isPeerId(peer)) {
            const peerIdB58Str = peer.toB58String();
            try {
                p = node.peerBook.get(peerIdB58Str);
            } catch (err) {
                return node.peerRouting.findPeer(peer, callback);
            }
        } else {
            return callback(
                errCode(
                    new Error(`${p} is not a valid peer type`),
                    "ERR_INVALID_PEER_TYPE"
                )
            );
        }

        callback(null, p);
    };
};
