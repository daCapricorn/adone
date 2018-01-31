const {
    stream: { pull }
} = adone;

export default class Connection {
    constructor(conn, info) {
        this.peerInfo = null;
        this.conn = pull.defer.duplex();

        if (conn) {
            this.setInnerConn(conn, info);
        } else if (info) {
            this.info = info;
        }
    }

    get source() {
        return this.conn.source;
    }

    get sink() {
        return this.conn.sink;
    }

    getPeerInfo() {
        if (this.info && this.info.getPeerInfo) {
            return this.info.getPeerInfo();
        }

        if (!this.peerInfo) {
            throw new Error("Peer Info not set yet");
        }

        return this.peerInfo;
    }

    setPeerInfo(peerInfo) {
        if (this.info && this.info.setPeerInfo) {
            return this.info.setPeerInfo(peerInfo);
        }

        this.peerInfo = peerInfo;
    }

    getObservedAddrs(callback) {
        if (this.info && this.info.getObservedAddrs) {
            return this.info.getObservedAddrs(callback);
        }
        callback(null, []);
    }

    setInnerConn(conn, info) {
        this.conn.resolve(conn);
        if (info) {
            this.info = info;
        } else {
            this.info = conn;
        }
    }
}