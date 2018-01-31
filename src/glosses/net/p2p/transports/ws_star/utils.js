const {
    is,
    multi,
    net: { p2p: { crypto, PeerId } }
} = adone;

const cleanUrlSIO = function (ma) {
    const protos = ma.protos();
    const ipProto = protos[0].name;
    const tcpProto = protos[1].name;
    const wsProto = protos[2].name;
    const stringTuples = ma.stringTuples();
    const tcpPort = stringTuples[1][1];

    if (tcpProto !== "tcp" || (wsProto !== "ws" && wsProto !== "wss")) {
        throw new Error(`invalid multiaddr: ${ma.toString()}`);
    }

    let host = stringTuples[0][1];
    if (ipProto === "ip6") {
        host = `[${host}]`;
    }

    const proto = wsProto === "wss" ? "https" : "http";
    const port =
        (wsProto === "ws" && tcpPort === 80) || (wsProto === "wss" && tcpPort === 443)
            ? "" : tcpPort;

    return `${proto}://${host}${port ? `:${port}` : ""}`;
};

const types = {
    string: (v) => is.string(v),
    object: (v) => typeof v === "object",
    multiaddr: (v) => {
        if (!types.string(v)) {
            return;
        }
        try {
            multi.address.create(v);
            return true;
        } catch (e) {
            return false;
        }
    },
    function: (v) => is.function(v)
};

const validate = function (def, data) {
    if (!is.array(data)) {
        throw new Error("Data is not an array");
    }
    def.forEach((type, index) => {
        if (!types[type]) {
            console.error("Type %s does not exist", type); // eslint-disable-line no-console
            throw new Error(`Type ${type} does not exist`);
        }
        if (!types[type](data[index])) {
            throw new Error(`Data at index ${index} is invalid for type ${type}`);
        }
    });
};

const Protocol = function (log) {
    if (!log) {
        log = () => { };
    }
    const self = this;
    self.requests = {};
    self.addRequest = (name, def, handle) => {
        self.requests[name] = {
            def,
            handle
        };
    };
    self.handleSocket = (socket) => {
        socket.r = {};
        Object.keys(self.requests).forEach((request) => {
            const r = self.requests[request];
            socket.on(request, function () {
                const data = [...arguments];
                try {
                    validate(r.def, data);
                    data.unshift(socket);
                    r.handle.apply(null, data);
                } catch (e) {
                    log(e);
                    log("peer %s has sent invalid data for request %s", socket.id || "<server>", request, data);
                }
            });
        });
    };
};

const getIdAndValidate = function (pub, id) {
    const _id = PeerId.createFromPubKey(Buffer.from(pub, "hex"));
    if (_id.asBase58() !== id) {
        throw new Error("Id is not matching");
    }

    return crypto.keys.unmarshalPublicKey(Buffer.from(pub, "hex"));
};

exports = module.exports;
exports.cleanUrlSIO = cleanUrlSIO;
exports.validate = validate;
exports.Protocol = Protocol;
exports.getIdAndValidate = getIdAndValidate;
exports.validateMa = (ma) => multi.address.validator.WebSocketStar.matches(multi.address.create(ma));