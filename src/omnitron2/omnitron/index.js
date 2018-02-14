import "adone";

const {
    application,
    is,
    std,
    fs,
    netron: { Context, Public },
    omnitron,
    runtime
} = adone;

const previousUsage = process.cpuUsage();

// The order of the subsystems is significant.
const CORE_SUBSYSTEMS = [
    "services",
    "gates"
];

@Context({
    description: "Omnitron"
})
export default class Omnitron extends application.Application {
    async configure() {
        // Force create home and runtime directories
        await fs.mkdirp(adone.realm.config.runtimePath);

        // Add subsystems
        for (const name of CORE_SUBSYSTEMS) {
            // eslint-disable-next-line
            this.addSubsystem({
                subsystem: std.path.join(__dirname, "subsystems", name),
                name,
                bind: true,
                group: "core"
            });
        }

        if (!is.windows) {
            this.exitOnSignal("SIGQUIT", "SIGTERM", "SIGINT");
            process.on("SIGILL", () => {
                if (is.function(global.gc)) {
                    global.gc();
                    adone.info("Forced garbage collector");
                }
            });
        }
    }

    async initialize() {
        this.db = await omnitron.DB.open();
        adone.info("Database opened");

        await runtime.netron.attachContext(this, "omnitron");
        adone.info("Omnitron context attached");

        await this.createPidFile();
    }

    async main() {
        if (is.function(process.send)) {
            process.send({
                pid: process.pid
            });
        }

        adone.info(`Omnitron v${adone.package.version} started`);
    }

    async uninitialize() {
        await this.deletePidFile();

        // Unitialize services in omnitron group
        // ...

        // Uninitialize managers in right order
        for (const name of CORE_SUBSYSTEMS) {
            try {
                await this.uninitializeSubsystem(name); // eslint-disable-line
            } catch (err) {
                adone.error(err);
            }
        }

        if (runtime.netron.hasContext("omnitron")) {
            await runtime.netron.detachContext("omnitron");
            adone.info("Omnitron context detached");
        }

        await this.db.close();
        adone.info("Database closed");

        adone.info("Omnitron stopped");
    }

    async createPidFile() {
        try {
            await fs.writeFile(adone.realm.config.omnitron.pidFilePath, process.pid.toString());
        } catch (err) {
            adone.error(err.message);
        }
    }

    async deletePidFile() {
        try {
            await fs.rm(adone.realm.config.omnitron.pidFilePath);
        } catch (err) {
            adone.error(err.message);
        }
    }

    _signalExit(sigName) {
        if (is.string(sigName)) {
            adone.info(`Killed by signal '${sigName}'`);
        } else {
            adone.info("Killed using api");
        }
        return super._signalExit(sigName);
    }

    // Omnitron interface

    @Public({
        description: "Force garbage collector"
    })
    gc() {
        if (is.function(global.gc)) {
            global.gc();
            return "done";
        }
        return "none";
    }

    @Public({
        description: "Kill omnitron"
    })
    kill() {
        process.nextTick(() => {
            this._signalExit();
        });
    }

    @Public({
        description: "Returns information about omnitron",
        type: Object
    })
    async getInfo({ process: proc = false, version = false, realm = false, env = false, netron = false } = {}) {
        const result = {};

        if (!proc && !version && !realm && !env && !netron) {
            proc = true;
            version = true;
            realm = true;
            env = true;
            netron = true;
        }

        if (proc) {
            const cpuUsage = process.cpuUsage(previousUsage);
            cpuUsage.user = cpuUsage.user / 1000;
            cpuUsage.system = cpuUsage.system / 1000;

            const totalMemory = adone.std.os.totalmem();
            const memoryUsage = process.memoryUsage();

            result.process = {
                id: process.pid,
                uptime: adone.util.humanizeTime(1000 * Math.floor(process.uptime())),
                cpu: {
                    user: adone.util.humanizeTime(cpuUsage.user),
                    system: adone.util.humanizeTime(cpuUsage.system)
                },
                memory: {
                    total: adone.util.humanizeSize(totalMemory),
                    used: `${adone.util.humanizeSize(memoryUsage.rss)} (${(memoryUsage.rss / totalMemory * 100).toFixed(0)}%)`,
                    detail: {
                        total: totalMemory,
                        ...memoryUsage
                    }
                }
            };
        }

        if (version) {
            result.version = {
                adone: adone.package.version,
                ...process.versions
            };
        }

        if (realm) {
            result.realm = {
                uid: (await adone.realm.getManager()).id,
                name: adone.realm.config.realm
            };
        }

        if (env) {
            result.env = Object.assign({}, process.env);
        }

        if (netron) {
            result.netron = adone.util.omit(adone.runtime.netron.options, (key, val) => is.function(val));
        }

        return result;
    }

    @Public({
        description: "Updates omnitron's environment variables"
    })
    setEnvs(envs) {
        for (const [key, val] of Object.entries(envs)) {
            process.env[key] = val;
        }
    }

    @Public({
        description: "Updates omnitron's environment variables"
    })
    updateEnvs(envs) {
        for (const [key, val] of Object.entries(envs)) {
            process.env[key] = val;
        }

        for (const key of Object.keys(process.env)) {
            if (!is.propertyDefined(envs, key)) {
                delete process.env[key];
            }
        }
    }

    @Public({
        description: "Register new service"
    })
    registerService(name) {
        return this.db.registerService(name);
    }

    @Public({
        description: "Register existing service"
    })
    unregisterService(name) {
        return this.db.unregisterService(name);
    }

    @Public({
        description: "Return list of services",
        type: Array
    })
    enumerate(filter) {
        return this.services.enumerate(filter);
    }

    @Public({
        description: "Return object of grouped services",
        type: Array
    })
    enumerateByGroup(group) {
        return this.services.enumerateByGroup(group);
    }

    @Public({
        description: "Return list of groups",
        type: Array
    })
    enumerateGroups() {
        return this.services.enumerateGroups();
    }

    @Public({})
    getMaintainer(group) {
        return this.services.getMaintainer(group, true);
    }

    @Public({
        description: "Enables service"
    })
    enableService(name, options) {
        return this.services.enableService(name, options);
    }

    @Public({
        description: "Disables service"
    })
    disableService(name, options) {
        return this.services.disableService(name, options);
    }

    @Public({
        description: "Starts service"
    })
    startService(name) {
        return this.services.startService(name);
    }

    @Public({
        description: "Stops service"
    })
    stopService(name) {
        return this.services.stopService(name);
    }

    @Public({
        description: "Configures service"
    })
    configureService(name, options) {
        return this.services.configureService(name, options);
    }

    @Public({
        description: "Returns valuable used as service configuration store"
    })
    async getServiceConfiguration(name) {
        await this.services.checkService(name);
        return this.db.getServiceConfiguration(name);
    }

    @Public({
        description: "Restarts service"
    })
    async restart(serviceName) {
        await this.stop(serviceName);
        return this.start(serviceName);
    }

    @Public({
        description: "Reports about omnitron process"
    })
    getReport() {
        return adone.application.report.getReport();
    }

    @Public({
        description: "Returns connected peer UIDs"
    })
    getPeers() {
        const peers = [...runtime.netron.getPeers().values()];

        return peers.map((peer) => {
            return {
                uid: peer.uid,
                address: peer.getRemoteAddress().full,
                connectedTime: peer.connectedTime
            };
        });
    }

    @Public({
        description: "Returns list of attached contexts"
    })
    getContexts() {
        const result = [];

        for (const [name, stub] of runtime.netron.contexts.entries()) {
            result.push({
                name,
                description: stub.definition.description
            });
        }

        return result;
    }

    // Subsystems
    @Public()
    getSubsystems() {
        return super.getSubsystems().map((ss) => ({
            name: ss.name,
            group: ss.group,
            description: ss.description,
            path: ss.path
        }));
    }

    @Public()
    async loadSubsystem(path, options) {
        await super.loadSubsystem(path, options);
    }

    @Public()
    async unloadSubsystem(name) {
        if (CORE_SUBSYSTEMS.includes(name)) {
            throw new adone.exception.NotAllowed("Unload core subsystem is not possible");
        }
        await super.unloadSubsystem(name);
    }

    // Configuration
    @Public()
    getConfiguration() {
        return this.db.getConfiguration();
    }

    // Gates
    @Public()
    addGate(gate) {
        return this.gates.addGate(gate);
    }

    @Public()
    deleteGate(gate) {
        return this.gates.deleteGate(gate);
    }

    @Public()
    upGate(name) {
        return this.gates.upGate(name);
    }

    @Public()
    downGate(name) {
        return this.gates.downGate(name);
    }

    @Public()
    getGates(options) {
        return this.gates.getGates(options);
    }

    @Public()
    configureGate(name, options) {
        return this.gates.configureGate(name, options);
    }
}

if (require.main === module) {
    if (!is.function(process.send)) {
        console.log(adone.terminal.chalk.red("Omnitron cannot be launched directly"));
        process.exit(application.EXIT_ERROR);
    }
    application.run(Omnitron);
}