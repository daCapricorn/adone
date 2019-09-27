const {
    p2p: { util: { ipPortToMultiaddr }}
} = adone;

describe("IP and port to Multiaddr", () => {
    it("creates multiaddr from valid IPv4 IP and port", () => {
        const ip = "127.0.0.1";
        const port = "9090";
        expect(ipPortToMultiaddr(ip, port).toString()).to.equal(`/ip4/${ip}/tcp/${port}`);
    });

    it("creates multiaddr from valid IPv4 IP and numeric port", () => {
        const ip = "127.0.0.1";
        const port = 9090;
        expect(ipPortToMultiaddr(ip, port).toString()).to.equal(`/ip4/${ip}/tcp/${port}`);
    });

    it("creates multiaddr from valid IPv4 in IPv6 IP and port", () => {
        const ip = "0:0:0:0:0:0:101.45.75.219";
        const port = "9090";
        expect(ipPortToMultiaddr(ip, port).toString()).to.equal(`/ip4/101.45.75.219/tcp/${port}`);
    });

    it("creates multiaddr from valid IPv6 IP and port", () => {
        const ip = "::1";
        const port = "9090";
        expect(ipPortToMultiaddr(ip, port).toString()).to.equal(`/ip6/${ip}/tcp/${port}`);
    });

    it("throws for missing IP address", () => {
        expect(() => ipPortToMultiaddr()).to.throw("invalid ip");
    });

    it("throws for invalid IP address", () => {
        const ip = "aewmrn4awoew";
        const port = "234";
        expect(() => ipPortToMultiaddr(ip, port)).to.throw("invalid ip");
    });

    it("throws for invalid port", () => {
        const ip = "127.0.0.1";
        const port = "garbage";
        expect(() => ipPortToMultiaddr(ip, port)).to.throw("invalid port");
    });
});