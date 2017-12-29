const {
    multi,
    noop,
    netron2: { Connection },
    std: { os },
    stream: { pull },
    vendor: { lodash: { includes } }
} = adone;

module.exports = (options, handler) => {
    const listener = pull.ws.createServer((socket) => {
        socket.getObservedAddrs = (callback) => {
            // TODO research if we can reuse the address in anyway
            return callback(null, []);
        };

        handler(new Connection(socket));
    });

    let listeningMultiaddr;

    listener._listen = listener.listen;
    listener.listen = (ma, callback) => {
        callback = callback || noop;
        listeningMultiaddr = ma;

        if (includes(ma.protoNames(), "ipfs")) {
            ma = ma.decapsulate("ipfs");
        }

        listener._listen(ma.toOptions(), callback);
    };

    listener.getAddrs = (callback) => {
        const multiaddrs = [];
        const address = listener.address();

        if (!address) {
            return callback(new Error("Listener is not ready yet"));
        }

        const ipfsId = listeningMultiaddr.getPeerId();

        // Because TCP will only return the IPv6 version
        // we need to capture from the passed multiaddr
        if (listeningMultiaddr.toString().indexOf("ip4") !== -1) {
            let m = listeningMultiaddr.decapsulate("tcp");
            m = m.encapsulate(`/tcp/${address.port}/ws`);
            if (listeningMultiaddr.getPeerId()) {
                m = m.encapsulate(`/ipfs/${ipfsId}`);
            }

            if (m.toString().indexOf("0.0.0.0") !== -1) {
                const netInterfaces = os.networkInterfaces();
                Object.keys(netInterfaces).forEach((niKey) => {
                    netInterfaces[niKey].forEach((ni) => {
                        if (ni.family === "IPv4") {
                            multiaddrs.push(multi.address.create(m.toString().replace("0.0.0.0", ni.address)));
                        }
                    });
                });
            } else {
                multiaddrs.push(m);
            }
        }

        callback(null, multiaddrs);
    };

    return listener;
};