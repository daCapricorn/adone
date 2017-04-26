const EventEmitter = require("events").EventEmitter;
const inherits = require("util").inherits;
const CServer = require("../core").Server;
const Cursor = require("./cursor");
const AggregationCursor = require("./aggregation_cursor");
const CommandCursor = require("./command_cursor");
const f = require("util").format;
const ServerCapabilities = require("./topology_base").ServerCapabilities;
const Store = require("./topology_base").Store;
const Define = require("./metadata");
const MongoError = require("../core").MongoError;
const MAX_JS_INT = require("./utils").MAX_JS_INT;
const translateOptions = require("./utils").translateOptions;
const filterOptions = require("./utils").filterOptions;
const mergeOptions = require("./utils").mergeOptions;
const getReadPreference = require("./utils").getReadPreference;
const os = require("os");

// Get package.json variable
const driverVersion = "2.2.22";
const nodejsversion = f("Node.js %s, %s", process.version, os.endianness());
const type = os.type();
const name = process.platform;
const architecture = process.arch;
const release = os.release();

/**
 * @fileOverview The **Server** class is a class that represents a single server topology and is
 * used to construct connections.
 *
 * **Server Should not be used, use MongoClient.connect**
 * @example
 * var Db = require('mongodb').Db,
 *   Server = require('mongodb').Server,
 *   test = require('assert');
 * // Connect using single Server
 * var db = new Db('test', new Server('localhost', 27017););
 * db.open(function(err, db) {
 *   // Get an additional db
 *   db.close();
 * });
 */

// Allowed parameters
const legalOptionNames = ["ha", "haInterval", "acceptableLatencyMS",
    "poolSize", "ssl", "checkServerIdentity", "sslValidate",
    "sslCA", "sslCRL", "sslCert", "sslKey", "sslPass", "socketOptions", "bufferMaxEntries",
    "store", "auto_reconnect", "autoReconnect", "emitError",
    "keepAlive", "noDelay", "connectTimeoutMS", "socketTimeoutMS",
    "reconnectTries", "reconnectInterval", "monitoring",
    "appname", "domainsEnabled",
    "servername", "promoteLongs", "promoteValues", "promoteBuffers"];

/**
 * Creates a new Server instance
 * @class
 * @deprecated
 * @param {string} host The host for the server, can be either an IP4, IP6 or domain socket style host.
 * @param {number} [port] The server port if IP4.
 * @param {object} [options=null] Optional settings.
 * @param {number} [options.poolSize=5] Number of connections in the connection pool for each server instance, set to 5 as default for legacy reasons.
 * @param {boolean} [options.ssl=false] Use ssl connection (needs to have a mongod server with ssl support)
 * @param {object} [options.sslValidate=true] Validate mongod server certificate against ca (needs to have a mongod server with ssl support, 2.4 or higher)
 * @param {boolean|function} [options.checkServerIdentity=true] Ensure we check server identify during SSL, set to false to disable checking. Only works for Node 0.12.x or higher. You can pass in a boolean or your own checkServerIdentity override function.
 * @param {array} [options.sslCA=null] Array of valid certificates either as Buffers or Strings (needs to have a mongod server with ssl support, 2.4 or higher)
 * @param {(Buffer|string)} [options.sslCert=null] String or buffer containing the certificate we wish to present (needs to have a mongod server with ssl support, 2.4 or higher)
 * @param {array} [options.sslCRL=null] Array of revocation certificates either as Buffers or Strings (needs to have a mongod server with ssl support, 2.4 or higher)
 * @param {(Buffer|string)} [options.sslKey=null] String or buffer containing the certificate private key we wish to present (needs to have a mongod server with ssl support, 2.4 or higher)
 * @param {(Buffer|string)} [options.sslPass=null] String or buffer containing the certificate password (needs to have a mongod server with ssl support, 2.4 or higher)
 * @param {string} [options.servername=null] String containing the server name requested via TLS SNI.
 * @param {object} [options.socketOptions=null] Socket options
 * @param {boolean} [options.socketOptions.autoReconnect=true] Reconnect on error.
 * @param {boolean} [options.socketOptions.noDelay=true] TCP Socket NoDelay option.
 * @param {number} [options.socketOptions.keepAlive=0] TCP KeepAlive on the socket with a X ms delay before start.
 * @param {number} [options.socketOptions.connectTimeoutMS=0] TCP Connection timeout setting
 * @param {number} [options.socketOptions.socketTimeoutMS=0] TCP Socket timeout setting
 * @param {number} [options.reconnectTries=30] Server attempt to reconnect #times
 * @param {number} [options.reconnectInterval=1000] Server will wait # milliseconds between retries
 * @param {number} [options.monitoring=true] Triggers the server instance to call ismaster
 * @param {number} [options.haInterval=10000] The interval of calling ismaster when monitoring is enabled.
 * @param {boolean} [options.domainsEnabled=false] Enable the wrapping of the callback in the current domain, disabled by default to avoid perf hit.
 * @fires Server#connect
 * @fires Server#close
 * @fires Server#error
 * @fires Server#timeout
 * @fires Server#parseError
 * @fires Server#reconnect
 * @property {string} parserType the parser type used (c++ or js).
 * @return {Server} a Server instance.
 */
const Server = function (host, port, options) {
    options = options || {};
    if (!(this instanceof Server)) {
        return new Server(host, port, options);
    }
    EventEmitter.call(this);
    const self = this;

    // Filter the options
    options = filterOptions(options, legalOptionNames);

    // Stored options
    const storeOptions = {
        force: false,
        bufferMaxEntries: typeof options.bufferMaxEntries === "number" ? options.bufferMaxEntries : MAX_JS_INT
    };

    // Shared global store
    const store = options.store || new Store(self, storeOptions);

    // Detect if we have a socket connection
    if (host.indexOf("\/") != -1) {
        if (port != null && typeof port === "object") {
            options = port;
            port = null;
        }
    } else if (port == null) {
        throw MongoError.create({ message: "port must be specified", driver: true });
    }

    // Get the reconnect option
    let reconnect = typeof options.auto_reconnect === "boolean" ? options.auto_reconnect : true;
    reconnect = typeof options.autoReconnect === "boolean" ? options.autoReconnect : reconnect;

    // Clone options
    let clonedOptions = mergeOptions({}, {
        host, port, disconnectHandler: store,
        cursorFactory: Cursor,
        reconnect,
        emitError: typeof options.emitError === "boolean" ? options.emitError : true,
        size: typeof options.poolSize === "number" ? options.poolSize : 5
    });

    // Translate any SSL options and other connectivity options
    clonedOptions = translateOptions(clonedOptions, options);

    // Socket options
    const socketOptions = options.socketOptions && Object.keys(options.socketOptions).length > 0
        ? options.socketOptions : options;

    // Translate all the options to the mongodb-core ones
    clonedOptions = translateOptions(clonedOptions, socketOptions);
    if (typeof clonedOptions.keepAlive === "number") {
        clonedOptions.keepAliveInitialDelay = clonedOptions.keepAlive;
        clonedOptions.keepAlive = clonedOptions.keepAlive > 0;
    }

    // Build default client information
    this.clientInfo = {
        driver: {
            name: "nodejs",
            version: driverVersion
        },
        os: {
            type,
            name,
            architecture,
            version: release
        },
        platform: nodejsversion
    };

    // Build default client information
    clonedOptions.clientInfo = this.clientInfo;
    // Do we have an application specific string
    if (options.appname) {
        clonedOptions.clientInfo.application = { name: options.appname };
    }

    // Create an instance of a server instance from mongodb-core
    const server = new CServer(clonedOptions);

    // Define the internal properties
    this.s = {
        // Create an instance of a server instance from mongodb-core
        server,
        // Server capabilities
        sCapabilities: null,
        // Cloned options
        clonedOptions,
        // Reconnect
        reconnect: clonedOptions.reconnect,
        // Emit error
        emitError: clonedOptions.emitError,
        // Pool size
        poolSize: clonedOptions.size,
        // Store Options
        storeOptions,
        // Store
        store,
        // Host
        host,
        // Port
        port,
        // Options
        options
    };
};

inherits(Server, EventEmitter);

const define = Server.define = new Define("Server", Server, false);

// BSON property
Object.defineProperty(Server.prototype, "bson", {
    enumerable: true, get() {
        return this.s.server.s.bson;
    }
});

// Last ismaster
Object.defineProperty(Server.prototype, "isMasterDoc", {
    enumerable: true, get() {
        return this.s.server.lastIsMaster();
    }
});

Object.defineProperty(Server.prototype, "parserType", {
    enumerable: true, get() {
        return this.s.server.parserType;
    }
});

// Last ismaster
Object.defineProperty(Server.prototype, "poolSize", {
    enumerable: true, get() {
        return this.s.server.connections().length;
    }
});

Object.defineProperty(Server.prototype, "autoReconnect", {
    enumerable: true, get() {
        return this.s.reconnect;
    }
});

Object.defineProperty(Server.prototype, "host", {
    enumerable: true, get() {
        return this.s.host;
    }
});

Object.defineProperty(Server.prototype, "port", {
    enumerable: true, get() {
        return this.s.port;
    }
});

// Connect
Server.prototype.connect = function (db, _options, callback) {
    const self = this;
    if (typeof _options === "function") {
        callback = _options, _options = {};
    }
    if (_options == null) {
        _options = {};
    }
    if (!(typeof callback === "function")) {
        callback = null;
    }
    self.s.options = _options;

    // Update bufferMaxEntries
    self.s.storeOptions.bufferMaxEntries = db.bufferMaxEntries;

    // Error handler
    const connectErrorHandler = function () {
        return function (err) {
            // Remove all event handlers
            const events = ["timeout", "error", "close"];
            events.forEach((e) => {
                self.s.server.removeListener(e, connectHandlers[e]);
            });

            self.s.server.removeListener("connect", connectErrorHandler);

            // Try to callback
            try {
                callback(err);
            } catch (err) {
                process.nextTick(() => {
                    throw err;
                });
            }
        };
    };

    // Actual handler
    const errorHandler = function (event) {
        return function (err) {
            if (event != "error") {
                self.emit(event, err);
            }
        };
    };

    // Error handler
    const reconnectHandler = function () {
        self.emit("reconnect", self);
        self.s.store.execute();
    };

    // Reconnect failed
    const reconnectFailedHandler = function (err) {
        self.emit("reconnectFailed", err);
        self.s.store.flush(err);
    };

    // Destroy called on topology, perform cleanup
    const destroyHandler = function () {
        self.s.store.flush();
    };

    // Connect handler
    const connectHandler = function () {
        // Clear out all the current handlers left over
        ["timeout", "error", "close", "serverOpening", "serverDescriptionChanged", "serverHeartbeatStarted",
            "serverHeartbeatSucceeded", "serverHeartbeatFailed", "serverClosed", "topologyOpening",
            "topologyClosed", "topologyDescriptionChanged"].forEach((e) => {
                self.s.server.removeAllListeners(e);
            });

        // Set up listeners
        self.s.server.on("timeout", errorHandler("timeout"));
        self.s.server.once("error", errorHandler("error"));
        self.s.server.on("close", errorHandler("close"));
        // Only called on destroy
        self.s.server.on("destroy", destroyHandler);

        // relay the event
        const relay = function (event) {
            return function (t, server) {
                self.emit(event, t, server);
            };
        };

        // Set up SDAM listeners
        self.s.server.on("serverDescriptionChanged", relay("serverDescriptionChanged"));
        self.s.server.on("serverHeartbeatStarted", relay("serverHeartbeatStarted"));
        self.s.server.on("serverHeartbeatSucceeded", relay("serverHeartbeatSucceeded"));
        self.s.server.on("serverHeartbeatFailed", relay("serverHeartbeatFailed"));
        self.s.server.on("serverOpening", relay("serverOpening"));
        self.s.server.on("serverClosed", relay("serverClosed"));
        self.s.server.on("topologyOpening", relay("topologyOpening"));
        self.s.server.on("topologyClosed", relay("topologyClosed"));
        self.s.server.on("topologyDescriptionChanged", relay("topologyDescriptionChanged"));
        self.s.server.on("attemptReconnect", relay("attemptReconnect"));
        self.s.server.on("monitoring", relay("monitoring"));

        // Emit open event
        self.emit("open", null, self);

        // Return correctly
        try {
            callback(null, self);
        } catch (err) {
            console.log(err.stack);
            process.nextTick(() => {
                throw err;
            });
        }
    };

    // Set up listeners
    const connectHandlers = {
        timeout: connectErrorHandler("timeout"),
        error: connectErrorHandler("error"),
        close: connectErrorHandler("close")
    };

    // Add the event handlers
    self.s.server.once("timeout", connectHandlers.timeout);
    self.s.server.once("error", connectHandlers.error);
    self.s.server.once("close", connectHandlers.close);
    self.s.server.once("connect", connectHandler);
    // Reconnect server
    self.s.server.on("reconnect", reconnectHandler);
    self.s.server.on("reconnectFailed", reconnectFailedHandler);

    // Start connection
    self.s.server.connect(_options);
};

// Server capabilities
Server.prototype.capabilities = function () {
    if (this.s.sCapabilities) {
        return this.s.sCapabilities;
    }
    if (this.s.server.lastIsMaster() == null) {
        return null;
    }
    this.s.sCapabilities = new ServerCapabilities(this.s.server.lastIsMaster());
    return this.s.sCapabilities;
};

define.classMethod("capabilities", { callback: false, promise: false, returns: [ServerCapabilities] });

// Command
Server.prototype.command = function (ns, cmd, options, callback) {
    this.s.server.command(ns, cmd, getReadPreference(options), callback);
};

define.classMethod("command", { callback: true, promise: false });

// Insert
Server.prototype.insert = function (ns, ops, options, callback) {
    this.s.server.insert(ns, ops, options, callback);
};

define.classMethod("insert", { callback: true, promise: false });

// Update
Server.prototype.update = function (ns, ops, options, callback) {
    this.s.server.update(ns, ops, options, callback);
};

define.classMethod("update", { callback: true, promise: false });

// Remove
Server.prototype.remove = function (ns, ops, options, callback) {
    this.s.server.remove(ns, ops, options, callback);
};

define.classMethod("remove", { callback: true, promise: false });

// IsConnected
Server.prototype.isConnected = function () {
    return this.s.server.isConnected();
};

Server.prototype.isDestroyed = function () {
    return this.s.server.isDestroyed();
};

define.classMethod("isConnected", { callback: false, promise: false, returns: [Boolean] });

// Insert
Server.prototype.cursor = function (ns, cmd, options) {
    options.disconnectHandler = this.s.store;
    return this.s.server.cursor(ns, cmd, options);
};

define.classMethod("cursor", { callback: false, promise: false, returns: [Cursor, AggregationCursor, CommandCursor] });

Server.prototype.lastIsMaster = function () {
    return this.s.server.lastIsMaster();
};

/**
 * Unref all sockets
 * @method
 */
Server.prototype.unref = function () {
    this.s.server.unref();
};

Server.prototype.close = function (forceClosed) {
    this.s.server.destroy();
    // We need to wash out all stored processes
    if (forceClosed == true) {
        this.s.storeOptions.force = forceClosed;
        this.s.store.flush();
    }
};

define.classMethod("close", { callback: false, promise: false });

Server.prototype.auth = function () {
    const args = Array.prototype.slice.call(arguments, 0);
    this.s.server.auth.apply(this.s.server, args);
};

define.classMethod("auth", { callback: true, promise: false });

Server.prototype.logout = function () {
    const args = Array.prototype.slice.call(arguments, 0);
    this.s.server.logout.apply(this.s.server, args);
};

define.classMethod("logout", { callback: true, promise: false });

/**
 * All raw connections
 * @method
 * @return {array}
 */
Server.prototype.connections = function () {
    return this.s.server.connections();
};

define.classMethod("connections", { callback: false, promise: false, returns: [Array] });

/**
 * Server connect event
 *
 * @event Server#connect
 * @type {object}
 */

/**
 * Server close event
 *
 * @event Server#close
 * @type {object}
 */

/**
 * Server reconnect event
 *
 * @event Server#reconnect
 * @type {object}
 */

/**
 * Server error event
 *
 * @event Server#error
 * @type {MongoError}
 */

/**
 * Server timeout event
 *
 * @event Server#timeout
 * @type {object}
 */

/**
 * Server parseError event
 *
 * @event Server#parseError
 * @type {object}
 */

module.exports = Server;
