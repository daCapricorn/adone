const utils = require("./utils");
const Listener = require("./listener");
const cleanUrlSIO = utils.cleanUrlSIO;

const {
    crypto: { Identity },
    event,
    is,
    multi,
    net: { p2p: { PeerInfo, Connection } }
} = adone;

class WebsocketStar {
    /**
     * WebsocketStar Transport
     * @class
     * @param {Object} options - Options for the listener
     * @param {Identity} options.id - Id for the crypto challenge
     */
    constructor(options) {
        options = options || {};

        this.id = options.id;
        this.flag = options.allowJoinWithDisabledChallenge; // let's just refer to it as "flag"

        this.discovery = new event.Emitter();
        this.discovery.start = (callback) => {
            setImmediate(callback);
        };
        this.discovery.stop = (callback) => {
            setImmediate(callback);
        };

        this.listeners_list = {};
        this._peerDiscovered = this._peerDiscovered.bind(this);
    }

    /**
     * Sets the id after transport creation (aka the lazy way)
     * @param {Identity} id
     * @returns {undefined}
     */
    lazySetId(id) {
        if (!id) {
            return;
        }
        this.id = id;
        this.canCrypto = true;
    }

    /**
     * Dials a peer
     * @param {Multiaddr} ma - Multiaddr to connect to
     * @param {Object} options
     * @param {function} callback
     * @returns {Connection}
     */
    connect(ma, options, callback) {
        if (is.function(options)) {
            callback = options;
            options = {};
        }

        let url;
        try {
            url = cleanUrlSIO(ma);
        } catch (err) {
            return callback(err); // early
        }
        const listener = this.listeners_list[url];
        if (!listener) {
            callback(new Error("No listener for this server"));
            return new Connection();
        }
        return listener.connect(ma, options, callback);
    }

    /**
     * Creates a listener
     * @param {Object} options
     * @param {function} handler
     * @returns {Listener}
     */
    createListener(handler) {
        const listener = new Listener({
            id: this.id,
            handler,
            listeners: this.listeners_list,
            flag: this.flag
        });

        listener.on("peer", this._peerDiscovered);

        return listener;
    }

    /**
     * Filters multiaddrs
     * @param {Multiaddr[]} multiaddrs
     * @returns {boolean}
     */
    filter(multiaddrs) {
        if (!is.array(multiaddrs)) {
            multiaddrs = [multiaddrs];
        }

        return multiaddrs.filter((ma) => multi.address.validator.WebSocketStar.matches(ma));
    }

    /**
     * Used to fire peer events on the discovery part
     * @param {Multiaddr} maStr
     * @fires Discovery#peer
     * @returns {undefined}
     * @private
     */
    _peerDiscovered(maStr) {
        const peerIdStr = maStr.split("//p2p/").pop();
        const peerId = Identity.createFromBase58(peerIdStr);
        const peerInfo = new PeerInfo(peerId);

        peerInfo.multiaddrs.add(multi.address.create(maStr));
        this.discovery.emit("peer", peerInfo);
    }
}

module.exports = WebsocketStar;
WebsocketStar.utils = utils;
