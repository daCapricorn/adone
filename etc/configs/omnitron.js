// adone-dont-transpile

const { join } = require("path");

const home = process.env.ADONE_HOME;

// Below are configurable options

const storesPath = join(home, "stores");

module.exports = {
    logFilePath: join(home, "omnitron.log"),
    errorLogFilePath: join(home, "omnitron-err.log"),
    pidFilePath: join(home, "omnitron.pid"),
    servicesPath: join(home, "services"),
    storesPath,
    systemDbPath: join(storesPath, "system"),
    hostsDbPath: join(storesPath, "hosts"),
    getGate(opts) {
        if (opts.id !== undefined) {
            for (const gate of this.gates) {
                if (opts.id === gate.id) {
                    return gate;
                }
            }
            return;
        }
        const gates = [];
        for (const gate of this.gates) {
            if ((opts.type === undefined || opts.type === gate.type) && (opts.enabled === undefined || opts.enabled === gate.enabled)) {
                if (!Array.isArray(opts.contexts) || gate.access === undefined || !Array.isArray(gate.access.contexts)) {
                    gates.push(gate);
                } else {
                    const contexts = gate.access.contexts;
                    for (const svcName of opts.contexts) {
                        if (contexts.includes(svcName)) {
                            gates.push(gate);
                        }
                    }
                }
            }
        }

        return gates;
    },
    getServicePath(serviceName, dirName) {
        let fullPath;
        if (typeof(dirType) === "string") {            
            fullPath = join(this.servicesPath, serviceName, dirName);
        } else {
            fullPath = join(this.servicesPath, serviceName);
        }

        return adone.fs.mkdir(fullPath).then(() => fullPath);
    }
};