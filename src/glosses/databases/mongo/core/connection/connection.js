const {
    is, x,
    database: { mongo: { core: { Response, MongoError } } },
    std: { crypto, tls, net, events: EventEmitter }
} = adone;

let _id = 0;
let connectionAccounting = false;
let connections = {};


const deleteConnection = (id) => {
    // console.log("=== deleted connection " + id)
    delete connections[id];
};

const addConnection = (id, connection) => {
    // console.log("=== added connection " + id)
    connections[id] = connection;
};

//
// Connection handlers
const errorHandler = (self) => {
    return (err) => {
        if (connectionAccounting) {
            deleteConnection(self.id);
        }
        // Emit the error
        if (self.listeners("error").length > 0) {
            self.emit("error", MongoError.create(err), self);
        }
    };
};

const timeoutHandler = (self) => {
    return () => {
        if (connectionAccounting) {
            deleteConnection(self.id);
        }
        // Emit timeout error
        self.emit("timeout", MongoError.create(`connection ${self.id} to ${self.host}:${self.port} timed out`), self);
    };
};

const closeHandler = (self) => {
    return (hadError) => {
        if (connectionAccounting) {
            deleteConnection(self.id);
        }

        // Emit close event
        if (!hadError) {
            self.emit("close"
                , MongoError.create(`connection ${self.id} to ${self.host}:${self.port} closed`)
                , self);
        }
    };
};

const dataHandler = (self) => {
    return (data) => {
        // Parse until we are done with the data
        while (data.length > 0) {
            // If we still have bytes to read on the current message
            if (self.bytesRead > 0 && self.sizeOfMessage > 0) {
                // Calculate the amount of remaining bytes
                const remainingBytesToRead = self.sizeOfMessage - self.bytesRead;
                // Check if the current chunk contains the rest of the message
                if (remainingBytesToRead > data.length) {
                    // Copy the new data into the exiting buffer (should have been allocated when we know the message size)
                    data.copy(self.buffer, self.bytesRead);
                    // Adjust the number of bytes read so it point to the correct index in the buffer
                    self.bytesRead = self.bytesRead + data.length;

                    // Reset state of buffer
                    data = Buffer.alloc(0);
                } else {
                    // Copy the missing part of the data into our current buffer
                    data.copy(self.buffer, self.bytesRead, 0, remainingBytesToRead);
                    // Slice the overflow into a new buffer that we will then re-parse
                    data = data.slice(remainingBytesToRead);

                    // Emit current complete message
                    try {
                        const emitBuffer = self.buffer;
                        // Reset state of buffer
                        self.buffer = null;
                        self.sizeOfMessage = 0;
                        self.bytesRead = 0;
                        self.stubBuffer = null;
                        // Emit the buffer
                        self.messageHandler(new Response(self.bson, emitBuffer, self.responseOptions), self);
                    } catch (err) {
                        const errorObject = {
                            err: "socketHandler", trace: err, bin: self.buffer, parseState: {
                                sizeOfMessage: self.sizeOfMessage,
                                bytesRead: self.bytesRead,
                                stubBuffer: self.stubBuffer
                            }
                        };
                        // We got a parse Error fire it off then keep going
                        self.emit("parseError", errorObject, self);
                    }
                }
            } else {
                // Stub buffer is kept in case we don't get enough bytes to determine the
                // size of the message (< 4 bytes)
                if (!is.nil(self.stubBuffer) && self.stubBuffer.length > 0) {
                    // If we have enough bytes to determine the message size let's do it
                    if (self.stubBuffer.length + data.length > 4) {
                        // Prepad the data
                        const newData = Buffer.alloc(self.stubBuffer.length + data.length);
                        self.stubBuffer.copy(newData, 0);
                        data.copy(newData, self.stubBuffer.length);
                        // Reassign for parsing
                        data = newData;

                        // Reset state of buffer
                        self.buffer = null;
                        self.sizeOfMessage = 0;
                        self.bytesRead = 0;
                        self.stubBuffer = null;

                    } else {

                        // Add the the bytes to the stub buffer
                        const newStubBuffer = Buffer.alloc(self.stubBuffer.length + data.length);
                        // Copy existing stub buffer
                        self.stubBuffer.copy(newStubBuffer, 0);
                        // Copy missing part of the data
                        data.copy(newStubBuffer, self.stubBuffer.length);
                        // Exit parsing loop
                        data = Buffer.alloc(0);
                    }
                } else {
                    if (data.length > 4) {
                        // Retrieve the message size
                        // var sizeOfMessage = data.readUInt32LE(0);
                        const sizeOfMessage = data[0] | data[1] << 8 | data[2] << 16 | data[3] << 24;
                        // If we have a negative sizeOfMessage emit error and return
                        if (sizeOfMessage < 0 || sizeOfMessage > self.maxBsonMessageSize) {
                            const errorObject = {
                                err: "socketHandler", trace: "", bin: self.buffer, parseState: {
                                    sizeOfMessage,
                                    bytesRead: self.bytesRead,
                                    stubBuffer: self.stubBuffer
                                }
                            };
                            // We got a parse Error fire it off then keep going
                            self.emit("parseError", errorObject, self);
                            return;
                        }

                        // Ensure that the size of message is larger than 0 and less than the max allowed
                        if (
                            sizeOfMessage > 4 &&
                            sizeOfMessage < self.maxBsonMessageSize &&
                            sizeOfMessage > data.length
                        ) {
                            self.buffer = Buffer.alloc(sizeOfMessage);
                            // Copy all the data into the buffer
                            data.copy(self.buffer, 0);
                            // Update bytes read
                            self.bytesRead = data.length;
                            // Update sizeOfMessage
                            self.sizeOfMessage = sizeOfMessage;
                            // Ensure stub buffer is null
                            self.stubBuffer = null;
                            // Exit parsing loop
                            data = Buffer.alloc(0);

                        } else if (
                            sizeOfMessage > 4 &&
                            sizeOfMessage < self.maxBsonMessageSize &&
                            sizeOfMessage === data.length
                        ) {
                            try {
                                const emitBuffer = data;
                                // Reset state of buffer
                                self.buffer = null;
                                self.sizeOfMessage = 0;
                                self.bytesRead = 0;
                                self.stubBuffer = null;
                                // Exit parsing loop
                                data = Buffer.alloc(0);
                                // Emit the message
                                self.messageHandler(new Response(self.bson, emitBuffer, self.responseOptions), self);
                            } catch (err) {
                                self.emit("parseError", err, self);
                            }
                        } else if (sizeOfMessage <= 4 || sizeOfMessage > self.maxBsonMessageSize) {
                            const errorObject = {
                                err: "socketHandler", trace: null, bin: data, parseState: {
                                    sizeOfMessage,
                                    bytesRead: 0,
                                    buffer: null,
                                    stubBuffer: null
                                }
                            };
                            // We got a parse Error fire it off then keep going
                            self.emit("parseError", errorObject, self);

                            // Clear out the state of the parser
                            self.buffer = null;
                            self.sizeOfMessage = 0;
                            self.bytesRead = 0;
                            self.stubBuffer = null;
                            // Exit parsing loop
                            data = Buffer.alloc(0);
                        } else {
                            const emitBuffer = data.slice(0, sizeOfMessage);
                            // Reset state of buffer
                            self.buffer = null;
                            self.sizeOfMessage = 0;
                            self.bytesRead = 0;
                            self.stubBuffer = null;
                            // Copy rest of message
                            data = data.slice(sizeOfMessage);
                            // Emit the message
                            self.messageHandler(new Response(self.bson, emitBuffer, self.responseOptions), self);
                        }
                    } else {
                        // Create a buffer that contains the space for the non-complete message
                        self.stubBuffer = Buffer.alloc(data.length);
                        // Copy the data to the stub buffer
                        data.copy(self.stubBuffer, 0);
                        // Exit parsing loop
                        data = Buffer.alloc(0);
                    }
                }
            }
        }
    };
};

// List of socket level valid ssl options
const legalSslSocketOptions = [
    "pfx", "key", "passphrase",
    "cert", "ca", "ciphers", "NPNProtocols",
    "ALPNProtocols", "servername", "secureProtocol",
    "secureContext", "session", "minDHSize"
];

const merge = (options1, options2) => {
    // Merge in any allowed ssl options
    for (const name in options2) {
        if (!is.nil(options2[name]) && legalSslSocketOptions.includes(name)) {
            options1[name] = options2[name];
        }
    }
};

/**
 * Creates a new Connection instance
 * @class
 * @param {string} options.host The server host
 * @param {number} options.port The server port
 * @param {boolean} [options.keepAlive=true] TCP Connection keep alive enabled
 * @param {number} [options.keepAliveInitialDelay=0] Initial delay before TCP keep alive enabled
 * @param {boolean} [options.noDelay=true] TCP Connection no delay
 * @param {number} [options.connectionTimeout=0] TCP Connection timeout setting
 * @param {number} [options.socketTimeout=0] TCP Socket timeout setting
 * @param {boolean} [options.singleBufferSerializtion=true] Serialize into single buffer, trade of peak memory for serialization speed
 * @param {boolean} [options.ssl=false] Use SSL for connection
 * @param {boolean|function} [options.checkServerIdentity=true] Ensure we check server identify during SSL, set to false to disable checking. Only works for Node 0.12.x or higher. You can pass in a boolean or your own checkServerIdentity override function.
 * @param {Buffer} [options.ca] SSL Certificate store binary buffer
 * @param {Buffer} [options.crl] SSL Certificate revocation store binary buffer
 * @param {Buffer} [options.cert] SSL Certificate binary buffer
 * @param {Buffer} [options.key] SSL Key file binary buffer
 * @param {string} [options.passphrase] SSL Certificate pass phrase
 * @param {boolean} [options.rejectUnauthorized=true] Reject unauthorized server certificates
 * @param {boolean} [options.promoteLongs=true] Convert Long values from the db into Numbers if they fit into 53 bits
 * @param {boolean} [options.promoteValues=true] Promotes BSON values to native types where possible, set to false to only receive wrapper types.
 * @param {boolean} [options.promoteBuffers=false] Promotes Binary BSON values to native Node Buffers.
 * @fires Connection#connect
 * @fires Connection#close
 * @fires Connection#error
 * @fires Connection#timeout
 * @fires Connection#parseError
 * @return {Connection} A cursor instance
 */

export default class Connection extends EventEmitter {
    constructor(messageHandler, options = {}) {
        super();
        // Set empty if no options passed
        this.options = options;
        // Identification information
        this.id = _id++;
        // No bson parser passed in
        if (!options.bson) {
            throw new x.InvalidArgument("must pass in valid bson parser");
        }
        // Get bson parser
        this.bson = options.bson;
        // Grouping tag used for debugging purposes
        this.tag = options.tag;
        // Message handler
        this.messageHandler = messageHandler;

        // Max BSON message size
        this.maxBsonMessageSize = options.maxBsonMessageSize || (1024 * 1024 * 16 * 4);

        // Default options
        this.port = options.port || 27017;
        this.host = options.host || "localhost";
        this.keepAlive = is.boolean(options.keepAlive) ? options.keepAlive : true;
        this.keepAliveInitialDelay = options.keepAliveInitialDelay || 0;
        this.noDelay = is.boolean(options.noDelay) ? options.noDelay : true;
        this.connectionTimeout = options.connectionTimeout || 0;
        this.socketTimeout = options.socketTimeout || 0;

        // If connection was destroyed
        this.destroyed = false;

        // Check if we have a domain socket
        this.domainSocket = this.host.includes("\/");

        // Serialize commands using function
        this.singleBufferSerializtion = is.boolean(options.singleBufferSerializtion)
            ? options.singleBufferSerializtion
            : true;
        this.serializationFunction = this.singleBufferSerializtion ? "toBinUnified" : "toBin";

        // SSL options
        this.ca = options.ca || null;
        this.crl = options.crl || null;
        this.cert = options.cert || null;
        this.key = options.key || null;
        this.passphrase = options.passphrase || null;
        this.ssl = is.boolean(options.ssl) ? options.ssl : false;
        this.rejectUnauthorized = is.boolean(options.rejectUnauthorized) ? options.rejectUnauthorized : true;
        this.checkServerIdentity = is.boolean(options.checkServerIdentity) || is.function(options.checkServerIdentity)
            ? options.checkServerIdentity
            : true;

        // If ssl not enabled
        if (!this.ssl) {
            this.rejectUnauthorized = false;
        }

        // Response options
        this.responseOptions = {
            promoteLongs: is.boolean(options.promoteLongs) ? options.promoteLongs : true,
            promoteValues: is.boolean(options.promoteValues) ? options.promoteValues : true,
            promoteBuffers: is.boolean(options.promoteBuffers) ? options.promoteBuffers : false
        };

        // Flushing
        this.flushing = false;
        this.queue = [];

        // Internal state
        this.connection = null;
        this.writeStream = null;

        // Create hash method
        const hash = crypto.createHash("sha1");
        hash.update(`${this.host}:${this.port}`);

        // Create a hash name
        this.hashedName = hash.digest("hex");

        // All operations in flight on the connection
        this.workItems = [];
    }

    setSocketTimeout(value) {
        if (this.connection) {
            this.connection.setTimeout(value);
        }
    }

    resetSocketTimeout() {
        if (this.connection) {
            this.connection.setTimeout(this.socketTimeout);
        }
    }

    connect(_options = {}) {
        _options = _options || {};
        // Set the connections
        if (connectionAccounting) {
            addConnection(this.id, this);
        }
        // Check if we are overriding the promoteLongs
        if (is.boolean(_options.promoteLongs)) {
            this.responseOptions.promoteLongs = _options.promoteLongs;
            this.responseOptions.promoteValues = _options.promoteValues;
            this.responseOptions.promoteBuffers = _options.promoteBuffers;
        }

        // Create new connection instance
        this.connection = this.domainSocket
            ? net.createConnection(this.host)
            : net.createConnection(this.port, this.host);

        // Set the options for the connection
        this.connection.setKeepAlive(this.keepAlive, this.keepAliveInitialDelay);
        this.connection.setTimeout(this.connectionTimeout);
        this.connection.setNoDelay(this.noDelay);

        // If we have ssl enabled
        if (this.ssl) {
            const sslOptions = {
                socket: this.connection,
                rejectUnauthorized: this.rejectUnauthorized
            };

            // Merge in options
            merge(sslOptions, this.options);
            merge(sslOptions, _options);

            // Set options for ssl
            if (this.ca) {
                sslOptions.ca = this.ca;
            }
            if (this.crl) {
                sslOptions.crl = this.crl;
            }
            if (this.cert) {
                sslOptions.cert = this.cert;
            }
            if (this.key) {
                sslOptions.key = this.key;
            }
            if (this.passphrase) {
                sslOptions.passphrase = this.passphrase;
            }

            // Override checkServerIdentity behavior
            if (this.checkServerIdentity === false) {
                // Skip the identiy check by retuning undefined as per node documents
                // https://nodejs.org/api/tls.html#tls_tls_connect_options_callback
                sslOptions.checkServerIdentity = adone.noop;
            } else if (is.function(this.checkServerIdentity)) {
                sslOptions.checkServerIdentity = this.checkServerIdentity;
            }

            // Set default sni servername to be the same as host
            if (is.nil(sslOptions.servername)) {
                sslOptions.servername = this.host;
            }

            // Attempt SSL connection
            this.connection = tls.connect(this.port, this.host, sslOptions, () => {
                // Error on auth or skip
                if (this.connection.authorizationError && this.rejectUnauthorized) {
                    return this.emit("error", this.connection.authorizationError, this, { ssl: true });
                }

                // Set socket timeout instead of connection timeout
                this.connection.setTimeout(this.socketTimeout);
                // We are done emit connect
                this.emit("connect", this);
            });
            this.connection.setTimeout(this.connectionTimeout);
        } else {
            this.connection.on("connect", () => {
                // Set socket timeout instead of connection timeout
                this.connection.setTimeout(this.socketTimeout);
                // Emit connect event
                this.emit("connect", this);
            });
        }

        // Add handlers for events
        this.connection.once("error", errorHandler(this));
        this.connection.once("timeout", timeoutHandler(this));
        this.connection.once("close", closeHandler(this));
        this.connection.on("data", dataHandler(this));
    }

    unref() {
        if (this.connection) {
            this.connection.unref();
        } else {
            this.once("connect", () => {
                this.connection.unref();
            });
        }
    }

    destroy() {
        // Set the connections
        if (connectionAccounting) {
            deleteConnection(this.id);
        }
        if (this.connection) {
            // Catch posssible exception thrown by node 0.10.x
            try {
                this.connection.end();
            } catch (err) {
                //
            }
            // Destroy connection
            this.connection.destroy();
        }

        this.destroyed = true;
    }

    write(buffer) {
        // Write out the command
        if (!is.array(buffer)) {
            return this.connection.write(buffer, "binary");
        }
        // Iterate over all buffers and write them in order to the socket
        for (const b of buffer) {
            this.connection.write(b, "binary");
        }
    }

    isConnected() {
        if (this.destroyed) {
            return false;
        }
        return !this.connection.destroyed && this.connection.writable;
    }

    toString() {
        return `${this.id}`;
    }

    toJSON() {
        return { id: this.id, host: this.host, port: this.port };
    }

    static enableConnectionAccounting() {
        connectionAccounting = true;
        connections = {};
    }

    static disableConnectionAccounting() {
        connectionAccounting = false;
    }

    static connections() {
        return connections;
    }
}