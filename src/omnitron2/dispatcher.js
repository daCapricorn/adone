const {
    application: {
        Subsystem
    },
    is,
    fs,
    error,
    std,
    multi,
    omnitron2,
    runtime
} = adone;

export default class Dispatcher extends Subsystem {
    constructor(netron = adone.runtime.netron2) {
        super();

        this.netron = netron;
        if (!netron.hasNetCore("default")) {
            netron.createNetCore("default");
        }
        this.peer = null;
        this.descriptors = {
            stodut: null,
            stderr: null
        };

        netron.on("peer:disconnect", (peer) => {
            if (!is.null(this.peer) && this.peer.id === peer.id) {
                this.peer = null;
            }
        });
    }

    get omnitronPeerInfo() {
        if (is.undefined(this._peerInfo)) {
            this._peerInfo = adone.net.p2p.PeerInfo.create(adone.runtime.realm.identity);
            this._peerInfo.multiaddrs.add(multi.address.fromNodeAddress(omnitron2.defaultAddress));
        }
        return this._peerInfo;
    }

    /**
     * Subsystem overloaded method (should not be called directly).
     * This method is only useful in case when dispatcher used as subsystem.
     */
    async uninitialize() {
        if (this.db) {
            await this.db.close();
        }

        return this.disconnect();
    }


    // bind(options) {
    //     return runtime.netron.bind(options);
    // }

    // async bindGates(gates, { adapters = null } = {}) {
    //     if (is.plainObject(adapters)) {
    //         for (const [name, AdapterClass] of Object.entries(adapters)) {
    //             runtime.netron.registerAdapter(name, AdapterClass);
    //         }
    //     }

    //     for (const gate of gates) {
    //         // eslint-disable-next-line
    //         await this.bind(gate);
    //     }
    // }

    isConnected() {
        return is.netronPeer(this.peer);
    }

    // async connect(gate = null) {
    //     if (is.nil(gate) || is.nil(gate.port)) {
    //         return this.connectLocal();
    //     }

    //     this.peer = await runtime.netron.connect(gate);
    //     return this.peer;
    // }

    async connectLocal({ forceStart = true } = {}, _counter = 0) {
        let status = 0;
        if (is.null(this.peer)) {
            let peer = null;
            try {
                peer = await this.netron.connect({
                    port: omnitron2.port
                });
                status = _counter >= 1 ? 0 : 1;
            } catch (err) {
                if (!forceStart || _counter >= 3) {
                    throw err;
                }

                const pid = await this.startOmnitron();
                if (is.number(pid)) {
                    return this.connectLocal({
                        forceStart
                    }, ++_counter);
                }
            }
            this.peer = peer;
        }

        return status;
    }

    async disconnect() {
        if (!is.null(this.peer)) {
            await runtime.netron.disconnect();
            await runtime.netron.unbind();
            this.peer = null;
        }
    }

    async startOmnitron({ spiritualWay = true, gc = false } = {}) {
        if (spiritualWay) {
            const isActive = await this.isOmnitronActive();
            if (isActive) {
                let shouldDisconnect = false;
                if (is.null(this.peer)) {
                    shouldDisconnect = true;
                    await this.connectLocal({
                        forceStart: false
                    });
                }
                const result = await this.getInfo({
                    process: true
                });

                if (shouldDisconnect) {
                    await this.disconnect();
                }

                return result.process.id;
            }
            return new Promise(async (resolve, reject) => {
                const omniConfig = adone.runtime.realm.config.omnitron;
                this.descriptors.stdout = await fs.open(omniConfig.LOGFILE_PATH, "a");
                this.descriptors.stderr = await fs.open(omniConfig.ERRORLOGFILE_PATH, "a");
                const args = [std.path.resolve(__dirname, "omnitron/index.js")];
                if (gc) {
                    args.unshift("--expose-gc");
                }
                const child = std.child_process.spawn(process.execPath, args, {
                    detached: true,
                    cwd: process.cwd(),
                    stdio: ["ipc", this.descriptors.stdout, this.descriptors.stderr]
                });
                child.unref();
                child.once("error", reject);

                const onExit = (code) => {
                    if (code !== 0) {
                        reject(new Error(`Process exited with error code: ${code}`));
                    }
                };
                child.once("exit", onExit);
                child.once("message", (msg) => {
                    child.removeListener("error", reject);
                    child.removeListener("exit", onExit);
                    child.disconnect();
                    resolve(msg.pid);
                });
            });
        }
        return adone.application.run(omnitron2.Omnitron);
    }

    async stopOmnitron() {
        const isActive = await this.isOmnitronActive();
        if (isActive) {
            if (await fs.exists(adone.realm.config.omnitron2.pidFilePath)) {
                try {
                    const checkAlive = async (pid) => {
                        let elapsed = 0;
                        for (; ;) {
                            // eslint-disable-next-line
                            if (!(await adone.system.process.exists(pid))) {
                                return;
                            }
                            elapsed += 100;
                            if (elapsed >= 3000) {
                                throw new error.Timeout("Process is still alive");
                            }
                            await adone.promise.delay(100); // eslint-disable-line
                        }
                    };
                    const pid = parseInt(std.fs.readFileSync(adone.realm.config.omnitron2.pidFilePath).toString());
                    if (is.windows) {
                        try {
                            await this.connectLocal({
                                forceStart: false
                            });
                            await this.kill();
                            await this.peer.disconnect();
                            this.peer = null;
                            await checkAlive(pid);
                        } catch (err) {
                            return 0;
                        }
                    } else {
                        if (!is.null(this.peer)) {
                            await this.peer.disconnect();
                            this.peer = null;
                        }

                        try {
                            await adone.system.process.kill(pid);
                            await checkAlive(pid);
                        } catch (err) {
                            return 0;
                        }
                    }
                    return 1;
                } catch (err) {
                    return 0;
                }
            }
        } else {
            return 2;
        }

        if (!is.nil(this.descriptors.stdout)) {
            await fs.close(this.descriptors.stdout);
            this.descriptors.stdout = null;
        }
        if (!is.nil(this.descriptors.stderr)) {
            await fs.close(this.descriptors.stderr);
            this.descriptors.stderr = null;
        }
    }

    async restartOmnitron(spiritualWay = true) {
        await this.stopOmnitron();
        await this.startOmnitron(spiritualWay);
        await this.connectLocal({
            forceStart: false
        });
    }

    async isOmnitronActive() {
        try {
            const peer = await this.netron.connect("default", this.omnitronPeerInfo);
            await this.netron.disconnectPeer(peer);
            return true;
        } catch (err) {
            if (err instanceof adone.error.Connect) {
                return false;
            }
            throw err;
        }
    }

    async ping() {
        return !is.null(this.peer) && is.null(await this.peer.ping());
    }

    getInterface(name) {
        return this.peer.getInterfaceByName(name);
    }

    async registerService(serviceName) {
        try {
            const systemDb = new omnitron2.DB();
            await systemDb.open();
            await systemDb.registerService(serviceName);
            await systemDb.close();
        } catch (err) {
            await this.connectLocal({
                forceStart: false
            });
            await this.getInterface("omnitron").registerService(serviceName);
        }
    }

    async unregisterService(serviceName) {
        try {
            const systemDb = new omnitron2.DB();
            await systemDb.open();
            await systemDb.unregisterService(serviceName);
            await systemDb.close();
        } catch (err) {
            await this.connectLocal({
                firceStart: false
            });
            await this.getInterface("omnitron").unregisterService(serviceName);
        }
    }

    // Omnitron interface

    async getConfiguration() {
        let config;
        if (await this.isOmnitronActive()) {
            await this.connectLocal({
                forceStart: false
            });
            config = await this.getInterface("omnitron").getConfiguration();
        } else {
            this.db = await adone.omnitron2.DB.open();
            config = await this.db.getConfiguration();
        }
        return config;
    }

    kill() {
        return this.getInterface("omnitron").kill();
    }

    getInfo(options) {
        return this.getInterface("omnitron").getInfo(options);
    }

    setEnvs(envs) {
        return this.getInterface("omnitron").setEnvs(envs);
    }

    updateEnvs(envs) {
        return this.getInterface("omnitron").updateEnvs(envs);
    }

    startService(serviceName) {
        return this.getInterface("omnitron").startService(serviceName);
    }

    stopService(serviceName) {
        return this.getInterface("omnitron").stopService(serviceName);
    }

    configureService(serviceName, options) {
        return this.getInterface("omnitron").configureService(serviceName, options);
    }

    restart(serviceName = "") {
        return (serviceName === "") ? this.restartOmnitron() : this.getInterface("omnitron").restart(serviceName);
    }

    status(serviceName) {
        return this.getInterface("omnitron").status(serviceName);
    }

    enableService(serviceName, options) {
        return this.getInterface("omnitron").enableService(serviceName, options);
    }

    disableService(serviceName, options) {
        return this.getInterface("omnitron").disableService(serviceName, options);
    }

    enumerate(filter) {
        return this.getInterface("omnitron").enumerate(filter);
    }

    getPeers() {
        return this.getInterface("omnitron").getPeers();
    }

    getContexts() {
        return this.getInterface("omnitron").getContexts();
    }

    getReport() {
        return this.getInterface("omnitron").getReport();
    }

    getSubsystems() {
        return this.getInterface("omnitron").getSubsystems();
    }

    loadSubsystem(subsystem, options) {
        return this.getInterface("omnitron").loadSubsystem(subsystem, options);
    }

    unloadSubsystem(name) {
        return this.getInterface("omnitron").unloadSubsystem(name);
    }

    gc() {
        return this.getInterface("omnitron").gc();
    }

    addGate(gate) {
        return this.getInterface("omnitron").addGate(gate);
    }

    deleteGate(name) {
        return this.getInterface("omnitron").deleteGate(name);
    }

    getGates(options) {
        return this.getInterface("omnitron").getGates(options);
    }

    upGate(name) {
        return this.getInterface("omnitron").upGate(name);
    }

    downGate(name) {
        return this.getInterface("omnitron").downGate(name);
    }

    configureGate(name, options) {
        return this.getInterface("omnitron").configureGate(name, options);
    }
}
