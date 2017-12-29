const {
    multi,
    netron2: { PeerInfo, PeerId, transport: { TCP } },
    std: { os }
} = adone;

const tcp = new TCP();

module.exports = {
    queryLAN(mdns, serviceTag, interval) {
        setInterval(() => {
            mdns.query({
                questions: [{
                    name: serviceTag,
                    type: "PTR"
                }]
            });
        }, interval);
    },

    gotResponse(rsp, peerInfo, serviceTag, callback) {
        if (!rsp.answers) {
            return;
        }

        const answers = {
            ptr: {},
            srv: {},
            txt: {},
            a: [],
            aaaa: []
        };

        rsp.answers.forEach((answer) => {
            switch (answer.type) {
                case "PTR": answers.ptr = answer; break;
                case "SRV": answers.srv = answer; break;
                case "TXT": answers.txt = answer; break;
                case "A": answers.a.push(answer); break;
                case "AAAA": answers.aaaa.push(answer); break;
                default: break;
            }
        });

        if (answers.ptr.name !== serviceTag) {
            return;
        }

        const b58Id = answers.txt.data.toString();
        const port = answers.srv.data.port;
        const multiaddrs = [];

        answers.a.forEach((a) => {
            multiaddrs.push(new multi.address.Multiaddr(`/ip4/${a.data}/tcp/${port}`));
        });

        // TODO Create multiaddrs from AAAA (IPv6) records as well

        if (peerInfo.id.toB58String() === b58Id) {
            return; // replied to myself, ignore
        }

        adone.log("peer found -", b58Id);

        const peerId = PeerId.createFromB58String(b58Id);

        try {
            const peerFound = PeerInfo.create(peerId);    
            multiaddrs.forEach((addr) => peerFound.multiaddrs.add(addr));
            callback(null, peerFound);
        } catch (err) {
            callback(err);
            return adone.error("Error creating PeerInfo from new found peer", err);
        }
    },

    gotQuery(qry, mdns, peerInfo, serviceTag, broadcast) {
        if (!broadcast) {
            return;
        }

        const multiaddrs = tcp.filter(peerInfo.multiaddrs.toArray());
        // Only announce TCP for now
        if (multiaddrs.length === 0) {
            return;
        }

        if (qry.questions[0] && qry.questions[0].name === serviceTag) {
            const answers = [];

            answers.push({
                name: serviceTag,
                type: "PTR",
                class: 1,
                ttl: 120,
                data: `${peerInfo.id.toB58String()}.${serviceTag}`
            });

            // Only announce TCP multiaddrs for now
            const port = multiaddrs[0].toString().split("/")[4];

            answers.push({
                name: `${peerInfo.id.toB58String()}.${serviceTag}`,
                type: "SRV",
                class: 1,
                ttl: 120,
                data: {
                    priority: 10,
                    weight: 1,
                    port,
                    target: os.hostname()
                }
            });

            answers.push({
                name: `${peerInfo.id.toB58String()}.${serviceTag}`,
                type: "TXT",
                class: 1,
                ttl: 120,
                data: peerInfo.id.toB58String()
            });

            multiaddrs.forEach((ma) => {
                if (ma.protoNames()[0] === "ip4") {
                    answers.push({
                        name: os.hostname(),
                        type: "A",
                        class: 1,
                        ttl: 120,
                        data: ma.toString().split("/")[2]
                    });
                    return;
                }
                if (ma.protoNames()[0] === "ip6") {
                    answers.push({
                        name: os.hostname(),
                        type: "AAAA",
                        class: 1,
                        ttl: 120,
                        data: ma.toString().split("/")[2]
                    });
                }
            });

            mdns.respond(answers);
        }
    }
};