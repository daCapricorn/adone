describe("net", "http", "proxy", "socks", "agent", "http", () => {
    const {
        fs,
        net: {
            proxy: {
                socks
            },
            http: {
                client: {
                    request
                },
                server: {
                    Server: HTTPServer
                }
            }
        }
    } = adone;

    const fixtures = new fs.Directory(__dirname, "fixtures");

    let servers = [];

    const createHttpServer = (opts) => {
        const server = new HTTPServer(opts);
        servers.push(server);
        return server;
    };


    const privateKey = fixtures.getFile("private.key").contentsSync();
    const certificate = fixtures.getFile("certificate.crt").contentsSync();

    const httpsOpts = {
        secure: {
            key: privateKey,
            cert: certificate
        }
    };

    afterEach(async () => {
        await Promise.all(servers.map((x) => x.unbind()));
        servers = [];
    });

    let proxyServer;
    let proxyPort;

    before((done) => {
        proxyServer = socks.createServer({
            auths: [socks.auth.None()]
        }, (reqInfo, accept) => {
            proxyServer.emit("info", reqInfo);
            accept();
        });
        proxyServer.listen(0, () => {
            const addr = proxyServer.address();
            proxyPort = addr.port;
            done();
        });
    });

    after((done) => {
        proxyServer.close(done);
    });

    it("should make a http request through proxy", async () => {
        const serv = createHttpServer();
        serv.use((ctx) => {
            ctx.body = "hello";
        });
        await serv.bind();
        const { port } = serv.address();

        const s = spy();
        proxyServer.once("info", s);
        const res = await request.get(`http://localhost:${port}`, {
            httpAgent: new socks.agent.Http({
                proxyHost: "localhost",
                proxyPort
            })
        });
        expect(res.data).to.be.equal("hello");
        expect(s).to.have.been.calledOnce();
        expect(s).to.have.been.calledWith(match({
            dstAddr: "127.0.0.1",
            dstPort: port
        }));
    });

    it("should make a https request through proxy", async () => {
        const serv = createHttpServer();
        serv.use((ctx) => {
            ctx.body = "hello";
        });
        await serv.bind(httpsOpts);
        const { port } = serv.address();

        const s = spy();
        proxyServer.once("info", s);
        const res = await request.get(`https://localhost:${port}`, {
            rejectUnauthorized: false,
            httpsAgent: new socks.agent.Https({
                proxyHost: "localhost",
                proxyPort,
                rejectUnauthorized: false
            })
        });
        expect(res.data).to.be.equal("hello");
        expect(s).to.have.been.calledOnce();
        expect(s).to.have.been.calledWith(match({
            dstAddr: "127.0.0.1",
            dstPort: port
        }));
    });

    it("should throw if there is no proxy", async () => {
        const port = await adone.net.util.getPort();

        const err = await assert.throws(async () => {
            await request.get("https://google.com", {
                rejectUnauthorized: false,
                httpsAgent: new socks.agent.Https({
                    proxyHost: "localhost",
                    proxyPort: port
                })
            });
        });

        // TODO: better message? like "cannot connect to the proxy server"
        expect(err.message).to.be.equal(`connect ECONNREFUSED 127.0.0.1:${port}`);
    });

    it("should throw if the dest is down", async () => {
        const port = await adone.net.util.getPort();

        const s = spy();
        proxyServer.once("info", s);
        const err = await assert.throws(async () => {
            await request.get(`http://localhost:${port}`, {
                httpAgent: new socks.agent.Http({
                    proxyHost: "localhost",
                    proxyPort
                })
            });
        });
        expect(err.message).to.be.equal("connection refused");
        expect(s).to.have.been.calledOnce();
        expect(s).to.have.been.calledWith(match({
            dstAddr: "127.0.0.1",
            dstPort: port
        }));
    });

    it("should set correct default port for http", async () => {
        // it requires the internet connection

        const s = spy();
        proxyServer.once("info", s);
        const res = await request.get("http://ipecho.com", {
            httpAgent: new socks.agent.Http({
                localDNS: false,
                proxyHost: "localhost",
                proxyPort
            })
        });
        expect(res.status).to.be.equal(200);
        expect(res.data.length).to.be.gt(0);
        expect(s).to.have.been.calledOnce();
        expect(s).to.have.been.calledWith(match({
            dstAddr: "ipecho.com",
            dstPort: 80
        }));
    });

    it("should set correct default port for https", async () => {
        // it requires the internet connection

        const s = spy();
        proxyServer.on("info", s);
        const res = await request.get("https://google.com", {
            maxRedirects: 0,
            httpsAgent: new socks.agent.Https({
                localDNS: false,
                proxyHost: "localhost",
                proxyPort
            }),
            validateStatus: (x) => x === 302 || x === 200
        });
        expect(res.data.length).to.be.gt(0);
        expect(s).to.have.been.calledOnce();
        expect(s).to.have.been.calledWith(match({
            dstAddr: "google.com",
            dstPort: 443
        }));
    });

    it("should free sockets", async () => {
        const serv = createHttpServer();
        serv.use((ctx) => {
            ctx.body = "hello";
        });
        await serv.bind(httpsOpts);
        const { port } = serv.address();

        const agent = new socks.agent.Https({
            proxyHost: "localhost",
            proxyPort,
            rejectUnauthorized: false,
            keepAlive: true
        });

        const s = spy();
        agent.on("free", s);
        await request.get(`https://localhost:${port}`, {
            rejectUnauthorized: false,
            httpsAgent: agent
        });
        expect(s).to.have.been.calledOnce();
        await request.get(`https://localhost:${port}`, {
            rejectUnauthorized: false,
            httpsAgent: agent
        });
        expect(s).to.have.been.calledTwice();
        await request.get(`https://localhost:${port}`, {
            rejectUnauthorized: false,
            httpsAgent: agent
        });
        expect(s).to.have.been.calledThrice();
    });
});