const hat = require("hat");
const boom = require("boom");
const Joi = require("joi");
const defaults = require("lodash.defaultsdeep");
const FactoryDaemon = require("../factory_daemon");
const tmpDir = require("../utils/tmp-dir");

const routeConfig = {
    validate: {
        query: {
            id: Joi.string().alphanum().required()
        }
    }
};

const nodes = {};

/**
 * @namespace EndpointServerRoutes
 * @ignore
 * @param {Hapi.Server} server
 * @returns {void}
 */
module.exports = (server) => {
    server.route({
        method: "GET",
        path: "/util/tmp-dir",
        handler: (request, h) => {
            const type = request.query.type || "go";
            const path = tmpDir(type === "js");

            return { tmpDir: path };
        }
    });

    server.route({
        method: "GET",
        path: "/version",
        handler: (request, h) => {
            const type = request.query.type || "go";

            // TODO: use the ../src/index.js so that the right Factory is picked
            const f = new FactoryDaemon({ type });
            return new Promise((resolve) => {
                f.version((err, version) => {
                    if (err) {
                        return resolve(boom.badRequest(err));
                    }
                    resolve({ version });
                });
            });
        }
    });

    /**
     * Spawn an IPFS node
     * The repo is created in a temporary location and cleaned up on process exit.
     */
    server.route({
        method: "POST",
        path: "/spawn",
        handler: async (request, h) => {
            const payload = request.payload || {};

            // TODO: use the ../src/index.js so that the right Factory is picked
            const f = new FactoryDaemon({ type: payload.type });

            return new Promise((resolve) => {
                f.spawn(payload.options, (err, ipfsd) => {
                    if (err) {
                        return resolve(boom.badRequest(err));
                    }
                    const id = hat();
                    const initialized = ipfsd.initialized;
                    nodes[id] = ipfsd;
    
                    let api = null;
    
                    if (nodes[id].started) {
                        api = {
                            apiAddr: nodes[id].apiAddr
                                ? nodes[id].apiAddr.toString()
                                : "",
                            gatewayAddr: nodes[id].gatewayAddr
                                ? nodes[id].gatewayAddr.toString()
                                : ""
                        };
                    }
    
                    resolve({ id, api, initialized });
                });
            });
        }
    });

    /**
     * Initialize a repo.
     */
    server.route({
        method: "POST",
        path: "/init",
        handler: (request, h) => {
            const id = request.query.id;

            const payload = request.payload || {};

            return new Promise((resolve) => {
                nodes[id].init(payload.initOpts, (err) => {
                    if (err) {
                        return resolve(boom.badRequest(err));
                    }
    
                    resolve({ initialized: nodes[id].initialized });
                });
            });
        },
        config: routeConfig
    });

    /**
     * Start the daemon.
     */
    server.route({
        method: "POST",
        path: "/start",
        handler: (request, h) => {
            const id = request.query.id;

            const payload = request.payload || {};
            const flags = payload.flags || [];

            return new Promise((resolve) => {
                nodes[id].start(flags, (err) => {
                    if (err) {
                        return resolve(boom.badRequest(err));
                    }
    
                    resolve({
                        api: {
                            apiAddr: nodes[id].apiAddr.toString(),
                            gatewayAddr: nodes[id].gatewayAddr.toString()
                        }
                    });
                });
            });
        },
        config: routeConfig
    });

    /**
     * Get the address of connected IPFS API.
     */
    server.route({
        method: "GET",
        path: "/api-addr",
        handler: (request, h) => {
            const id = request.query.id;

            return { apiAddr: nodes[id].apiAddr.toString() };
        },
        config: routeConfig
    });

    /**
     * Get the address of connected IPFS HTTP Gateway.
     * @memberof EndpointServerRoutes
     */
    server.route({
        method: "GET",
        path: "/getaway-addr",
        handler: (request, h) => {
            const id = request.query.id;
            return { getawayAddr: nodes[id].gatewayAddr.toString() };
        },
        config: routeConfig
    });

    /**
     * Delete the repo that was being used.
     * If the node was marked as `disposable` this will be called
     * automatically when the process is exited.
     */
    server.route({
        method: "POST",
        path: "/cleanup",
        handler: (request, h) => {
            const id = request.query.id;
            return new Promise((resolve) => {
                nodes[id].cleanup((err) => {
                    if (err) {
                        return resolve(boom.badRequest(err));
                    }
    
                    resolve(h.response().code(200));
                });
            });
        },
        config: routeConfig
    });

    /**
     * Stop the daemon.
     */
    server.route({
        method: "POST",
        path: "/stop",
        handler: (request, h) => {
            const id = request.query.id;
            const timeout = request.payload.timeout;
            return new Promise((resolve) => {
                nodes[id].stop(timeout, (err) => {
                    if (err) {
                        return resolve(boom.badRequest(err));
                    }
    
                    resolve(h.response().code(200));
                });
            });
        },
        config: routeConfig
    });

    /**
     * Kill the `ipfs daemon` process.
     *
     * First `SIGTERM` is sent, after 7.5 seconds `SIGKILL` is sent
     * if the process hasn't exited yet.
     */
    server.route({
        method: "POST",
        path: "/kill",
        handler: (request, h) => {
            const id = request.query.id;
            const timeout = request.payload.timeout;
            return new Promise((resolve) => {
                nodes[id].killProcess(timeout, (err) => {
                    if (err) {
                        return resolve(boom.badRequest(err));
                    }
    
                    resolve(h.response().code(200));
                });
            });
        },
        config: routeConfig
    });

    /**
     * Get the pid of the `ipfs daemon` process.
     */
    server.route({
        method: "GET",
        path: "/pid",
        handler: (request, h) => {
            const id = request.query.id;

            return { pid: nodes[id].pid };
        },
        config: routeConfig
    });

    /**
     * Call `ipfs config`
     *
     * If no `key` is passed, the whole config is returned as an object.
     */
    server.route({
        method: "GET",
        path: "/config",
        handler: (request, h) => {
            const id = request.query.id;
            const key = request.query.key;
            return new Promise((resolve) => {
                nodes[id].getConfig(key, (err, config) => {
                    if (err) {
                        return resolve(boom.badRequest(err));
                    }
    
                    resolve({ config });
                });
            });
        },
        config: defaults({}, {
            validate: {
                query: {
                    key: Joi.string().optional()
                }
            }
        }, routeConfig)
    });

    /**
     * Set a config value.
     */
    server.route({
        method: "PUT",
        path: "/config",
        handler: (request, h) => {
            const id = request.query.id;
            const key = request.payload.key;
            const val = request.payload.value;

            return new Promise((resolve) => {
                nodes[id].setConfig(key, val, (err) => {
                    if (err) {
                        return resolve(boom.badRequest(err));
                    }
    
                    resolve(h.response().code(200));
                });
            });
        },
        config: defaults({}, {
            validate: {
                payload: {
                    key: Joi.string(),
                    value: Joi.any()
                }
            }
        }, routeConfig)
    });
};
