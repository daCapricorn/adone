const {
    multi
} = adone;

const cleanUrlSIO = function (ma) {
    const maStrSplit = ma.toString().split("/");
    const tcpProto = ma.protos()[1].name;
    const wsProto = ma.protos()[2].name;
    const tcpPort = ma.stringTuples()[1][1];

    if (tcpProto !== "tcp" || (wsProto !== "ws" && wsProto !== "wss")) {
        throw new Error(`invalid multiaddr: ${ma.toString()}`);
    }

    if (!multi.address.isName(ma)) {
        return `http://${maStrSplit[2]}:${maStrSplit[4]}`;
    }

    if (wsProto === "ws") {
        return `http://${maStrSplit[2]}${tcpPort === 80 ? "" : `:${tcpPort}`}`;
    }

    if (wsProto === "wss") {
        return `https://${maStrSplit[2]}${tcpPort === 443 ? "" : `:${tcpPort}`}`;
    }
};

const cleanMultiaddr = function (maStr) {
    const legacy = "/libp2p-webrtc-star";

    if (maStr.indexOf(legacy) !== -1) {
        maStr = maStr.substring(legacy.length, maStr.length);
        let ma = multi.address.create(maStr);
        const tuppleP2p = ma.stringTuples().filter((tupple) => {
            return tupple[0] === 421; // ipfs code
        })[0];

        ma = ma.decapsulate("ipfs");
        ma = ma.encapsulate("p2p-webrtc-star");
        ma = ma.encapsulate(`//p2p/${tuppleP2p[1]}`);
        maStr = ma.toString();
    }

    return maStr;
};

exports = module.exports;
exports.cleanUrlSIO = cleanUrlSIO;
exports.cleanMultiaddr = cleanMultiaddr;
