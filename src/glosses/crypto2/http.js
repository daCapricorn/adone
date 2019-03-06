/**
 * HTTP client-side implementation that uses forge.net sockets.
 *
 * @author Dave Longley
 *
 * Copyright (c) 2010-2014 Digital Bazaar, Inc. All rights reserved.
 */
const forge = require("./forge");
require("./debug");
require("./tls");
require("./util");

// define http namespace
const http = module.exports = forge.http = forge.http || {};

// logging category
const cat = "forge.http";

// add array of clients to debug storage
if (forge.debug) {
    forge.debug.set("forge.http", "clients", []);
}

// normalizes an http header field name
const _normalize = function (name) {
    return name.toLowerCase().replace(/(^.)|(-.)/g,
        (a) => {
            return a.toUpperCase(); 
        });
};

/**
 * Gets the local storage ID for the given client.
 *
 * @param client the client to get the local storage ID for.
 *
 * @return the local storage ID to use.
 */
const _getStorageId = function (client) {
    // TODO: include browser in ID to avoid sharing cookies between
    // browsers (if this is undesirable)
    // navigator.userAgent
    return `forge.http.${ 
        client.url.scheme}.${ 
        client.url.host}.${ 
        client.url.port}`;
};

/**
 * Loads persistent cookies from disk for the given client.
 *
 * @param client the client.
 */
const _loadCookies = function (client) {
    if (client.persistCookies) {
        try {
            const cookies = forge.util.getItem(
                client.socketPool.flashApi,
                _getStorageId(client), "cookies");
            client.cookies = cookies || {};
        } catch (ex) {
            // no flash storage available, just silently fail
            // TODO: i assume we want this logged somewhere or
            // should it actually generate an error
            //forge.log.error(cat, ex);
        }
    }
};

/**
 * Saves persistent cookies on disk for the given client.
 *
 * @param client the client.
 */
const _saveCookies = function (client) {
    if (client.persistCookies) {
        try {
            forge.util.setItem(
                client.socketPool.flashApi,
                _getStorageId(client), "cookies", client.cookies);
        } catch (ex) {
            // no flash storage available, just silently fail
            // TODO: i assume we want this logged somewhere or
            // should it actually generate an error
            //forge.log.error(cat, ex);
        }
    }

    // FIXME: remove me
    _loadCookies(client);
};

/**
 * Clears persistent cookies on disk for the given client.
 *
 * @param client the client.
 */
const _clearCookies = function (client) {
    if (client.persistCookies) {
        try {
            // only thing stored is 'cookies', so clear whole storage
            forge.util.clearItems(
                client.socketPool.flashApi,
                _getStorageId(client));
        } catch (ex) {
            // no flash storage available, just silently fail
            // TODO: i assume we want this logged somewhere or
            // should it actually generate an error
            //forge.log.error(cat, ex);
        }
    }
};

/**
 * Connects and sends a request.
 *
 * @param client the http client.
 * @param socket the socket to use.
 */
const _doRequest = function (client, socket) {
    if (socket.isConnected()) {
    // already connected
        socket.options.request.connectTime = Number(new Date());
        socket.connected({
            type: "connect",
            id: socket.id
        });
    } else {
    // connect
        socket.options.request.connectTime = Number(new Date());
        socket.connect({
            host: client.url.host,
            port: client.url.port,
            policyPort: client.policyPort,
            policyUrl: client.policyUrl
        });
    }
};

/**
 * Handles the next request or marks a socket as idle.
 *
 * @param client the http client.
 * @param socket the socket.
 */
const _handleNextRequest = function (client, socket) {
    // clear buffer
    socket.buffer.clear();

    // get pending request
    let pending = null;
    while (is.null(pending) && client.requests.length > 0) {
        pending = client.requests.shift();
        if (pending.request.aborted) {
            pending = null;
        }
    }

    // mark socket idle if no pending requests
    if (is.null(pending)) {
        if (!is.null(socket.options)) {
            socket.options = null;
        }
        client.idle.push(socket);
    } else {
    // handle pending request, allow 1 retry
        socket.retries = 1;
        socket.options = pending;
        _doRequest(client, socket);
    }
};

/**
 * Sets up a socket for use with an http client.
 *
 * @param client the parent http client.
 * @param socket the socket to set up.
 * @param tlsOptions if the socket must use TLS, the TLS options.
 */
const _initSocket = function (client, socket, tlsOptions) {
    // no socket options yet
    socket.options = null;

    // set up handlers
    socket.connected = function (e) {
    // socket primed by caching TLS session, handle next request
        if (is.null(socket.options)) {
            _handleNextRequest(client, socket);
        } else {
            // socket in use
            const request = socket.options.request;
            request.connectTime = Number(new Date()) - request.connectTime;
            e.socket = socket;
            socket.options.connected(e);
            if (request.aborted) {
                socket.close();
            } else {
                let out = request.toString();
                if (request.body) {
                    out += request.body;
                }
                request.time = Number(new Date());
                socket.send(out);
                request.time = Number(new Date()) - request.time;
                socket.options.response.time = Number(new Date());
                socket.sending = true;
            }
        }
    };
    socket.closed = function (e) {
        if (socket.sending) {
            socket.sending = false;
            if (socket.retries > 0) {
                --socket.retries;
                _doRequest(client, socket);
            } else {
                // error, closed during send
                socket.error({
                    id: socket.id,
                    type: "ioError",
                    message: "Connection closed during send. Broken pipe.",
                    bytesAvailable: 0
                });
            }
        } else {
            // handle unspecified content-length transfer
            const response = socket.options.response;
            if (response.readBodyUntilClose) {
                response.time = Number(new Date()) - response.time;
                response.bodyReceived = true;
                socket.options.bodyReady({
                    request: socket.options.request,
                    response,
                    socket
                });
            }
            socket.options.closed(e);
            _handleNextRequest(client, socket);
        }
    };
    socket.data = function (e) {
        socket.sending = false;
        const request = socket.options.request;
        if (request.aborted) {
            socket.close();
        } else {
            // receive all bytes available
            const response = socket.options.response;
            const bytes = socket.receive(e.bytesAvailable);
            if (!is.null(bytes)) {
                // receive header and then body
                socket.buffer.putBytes(bytes);
                if (!response.headerReceived) {
                    response.readHeader(socket.buffer);
                    if (response.headerReceived) {
                        socket.options.headerReady({
                            request: socket.options.request,
                            response,
                            socket
                        });
                    }
                }
                if (response.headerReceived && !response.bodyReceived) {
                    response.readBody(socket.buffer);
                }
                if (response.bodyReceived) {
                    socket.options.bodyReady({
                        request: socket.options.request,
                        response,
                        socket
                    });
                    // close connection if requested or by default on http/1.0
                    const value = response.getField("Connection") || "";
                    if (value.indexOf("close") != -1 ||
            (response.version === "HTTP/1.0" &&
            is.null(response.getField("Keep-Alive")))) {
                        socket.close();
                    } else {
                        _handleNextRequest(client, socket);
                    }
                }
            }
        }
    };
    socket.error = function (e) {
    // do error callback, include request
        socket.options.error({
            type: e.type,
            message: e.message,
            request: socket.options.request,
            response: socket.options.response,
            socket
        });
        socket.close();
    };

    // wrap socket for TLS
    if (tlsOptions) {
        socket = forge.tls.wrapSocket({
            sessionId: null,
            sessionCache: {},
            caStore: tlsOptions.caStore,
            cipherSuites: tlsOptions.cipherSuites,
            socket,
            virtualHost: tlsOptions.virtualHost,
            verify: tlsOptions.verify,
            getCertificate: tlsOptions.getCertificate,
            getPrivateKey: tlsOptions.getPrivateKey,
            getSignature: tlsOptions.getSignature,
            deflate: tlsOptions.deflate || null,
            inflate: tlsOptions.inflate || null
        });

        socket.options = null;
        socket.buffer = forge.util.createBuffer();
        client.sockets.push(socket);
        if (tlsOptions.prime) {
            // prime socket by connecting and caching TLS session, will do
            // next request from there
            socket.connect({
                host: client.url.host,
                port: client.url.port,
                policyPort: client.policyPort,
                policyUrl: client.policyUrl
            });
        } else {
            // do not prime socket, just add as idle
            client.idle.push(socket);
        }
    } else {
    // no need to prime non-TLS sockets
        socket.buffer = forge.util.createBuffer();
        client.sockets.push(socket);
        client.idle.push(socket);
    }
};

/**
 * Checks to see if the given cookie has expired. If the cookie's max-age
 * plus its created time is less than the time now, it has expired, unless
 * its max-age is set to -1 which indicates it will never expire.
 *
 * @param cookie the cookie to check.
 *
 * @return true if it has expired, false if not.
 */
const _hasCookieExpired = function (cookie) {
    let rval = false;

    if (cookie.maxAge !== -1) {
        const now = _getUtcTime(new Date());
        const expires = cookie.created + cookie.maxAge;
        if (expires <= now) {
            rval = true;
        }
    }

    return rval;
};

/**
 * Adds cookies in the given client to the given request.
 *
 * @param client the client.
 * @param request the request.
 */
const _writeCookies = function (client, request) {
    const expired = [];
    const url = client.url;
    const cookies = client.cookies;
    for (const name in cookies) {
    // get cookie paths
        const paths = cookies[name];
        for (const p in paths) {
            var cookie = paths[p];
            if (_hasCookieExpired(cookie)) {
                // store for clean up
                expired.push(cookie);
            } else if (request.path.indexOf(cookie.path) === 0) {
                // path or path's ancestor must match cookie.path
                request.addCookie(cookie);
            }
        }
    }

    // clean up expired cookies
    for (let i = 0; i < expired.length; ++i) {
        var cookie = expired[i];
        client.removeCookie(cookie.name, cookie.path);
    }
};

/**
 * Gets cookies from the given response and adds the to the given client.
 *
 * @param client the client.
 * @param response the response.
 */
const _readCookies = function (client, response) {
    const cookies = response.getCookies();
    for (let i = 0; i < cookies.length; ++i) {
        try {
            client.setCookie(cookies[i]);
        } catch (ex) {
            // ignore failure to add other-domain, etc. cookies
        }
    }
};

/**
 * Creates an http client that uses forge.net sockets as a backend and
 * forge.tls for security.
 *
 * @param options:
 *   url: the url to connect to (scheme://host:port).
 *     socketPool: the flash socket pool to use.
 *   policyPort: the flash policy port to use (if other than the
 *     socket pool default), use 0 for flash default.
 *   policyUrl: the flash policy file URL to use (if provided will
 *     be used instead of a policy port).
 *   connections: number of connections to use to handle requests.
 *   caCerts: an array of certificates to trust for TLS, certs may
 *     be PEM-formatted or cert objects produced via forge.pki.
 *   cipherSuites: an optional array of cipher suites to use,
 *     see forge.tls.CipherSuites.
 *   virtualHost: the virtual server name to use in a TLS SNI
 *     extension, if not provided the url host will be used.
 *   verify: a custom TLS certificate verify callback to use.
 *   getCertificate: an optional callback used to get a client-side
 *     certificate (see forge.tls for details).
 *   getPrivateKey: an optional callback used to get a client-side
 *     private key (see forge.tls for details).
 *   getSignature: an optional callback used to get a client-side
 *     signature (see forge.tls for details).
 *   persistCookies: true to use persistent cookies via flash local
 *     storage, false to only keep cookies in javascript.
 *   primeTlsSockets: true to immediately connect TLS sockets on
 *     their creation so that they will cache TLS sessions for reuse.
 *
 * @return the client.
 */
http.createClient = function (options) {
    // create CA store to share with all TLS connections
    let caStore = null;
    if (options.caCerts) {
        caStore = forge.pki.createCaStore(options.caCerts);
    }

    // get scheme, host, and port from url
    options.url = (options.url ||
    `${window.location.protocol}//${window.location.host}`);
    const url = http.parseUrl(options.url);
    if (!url) {
        const error = new Error("Invalid url.");
        error.details = { url: options.url };
        throw error;
    }

    // default to 1 connection
    options.connections = options.connections || 1;

    // create client
    const sp = options.socketPool;
    const client = {
    // url
        url,
        // socket pool
        socketPool: sp,
        // the policy port to use
        policyPort: options.policyPort,
        // policy url to use
        policyUrl: options.policyUrl,
        // queue of requests to service
        requests: [],
        // all sockets
        sockets: [],
        // idle sockets
        idle: [],
        // whether or not the connections are secure
        secure: (url.scheme === "https"),
        // cookie jar (key'd off of name and then path, there is only 1 domain
        // and one setting for secure per client so name+path is unique)
        cookies: {},
        // default to flash storage of cookies
        persistCookies: (is.undefined(options.persistCookies)) ?
            true : options.persistCookies
    };

    // add client to debug storage
    if (forge.debug) {
        forge.debug.get("forge.http", "clients").push(client);
    }

    // load cookies from disk
    _loadCookies(client);

    /**
     * A default certificate verify function that checks a certificate common
     * name against the client's URL host.
     *
     * @param c the TLS connection.
     * @param verified true if cert is verified, otherwise alert number.
     * @param depth the chain depth.
     * @param certs the cert chain.
     *
     * @return true if verified and the common name matches the host, error
     *         otherwise.
     */
    const _defaultCertificateVerify = function (c, verified, depth, certs) {
        if (depth === 0 && verified === true) {
            // compare common name to url host
            const cn = certs[depth].subject.getField("CN");
            if (is.null(cn) || client.url.host !== cn.value) {
                verified = {
                    message: "Certificate common name does not match url host."
                };
            }
        }
        return verified;
    };

    // determine if TLS is used
    let tlsOptions = null;
    if (client.secure) {
        tlsOptions = {
            caStore,
            cipherSuites: options.cipherSuites || null,
            virtualHost: options.virtualHost || url.host,
            verify: options.verify || _defaultCertificateVerify,
            getCertificate: options.getCertificate || null,
            getPrivateKey: options.getPrivateKey || null,
            getSignature: options.getSignature || null,
            prime: options.primeTlsSockets || false
        };

        // if socket pool uses a flash api, then add deflate support to TLS
        if (!is.null(sp.flashApi)) {
            tlsOptions.deflate = function (bytes) {
                // strip 2 byte zlib header and 4 byte trailer
                return forge.util.deflate(sp.flashApi, bytes, true);
            };
            tlsOptions.inflate = function (bytes) {
                return forge.util.inflate(sp.flashApi, bytes, true);
            };
        }
    }

    // create and initialize sockets
    for (let i = 0; i < options.connections; ++i) {
        _initSocket(client, sp.createSocket(), tlsOptions);
    }

    /**
     * Sends a request. A method 'abort' will be set on the request that
     * can be called to attempt to abort the request.
     *
     * @param options:
     *          request: the request to send.
     *          connected: a callback for when the connection is open.
     *          closed: a callback for when the connection is closed.
     *          headerReady: a callback for when the response header arrives.
     *          bodyReady: a callback for when the response body arrives.
     *          error: a callback for if an error occurs.
     */
    client.send = function (options) {
    // add host header if not set
        if (is.null(options.request.getField("Host"))) {
            options.request.setField("Host", client.url.fullHost);
        }

        // set default dummy handlers
        const opts = {};
        opts.request = options.request;
        opts.connected = options.connected || function () {};
        opts.closed = options.close || function () {};
        opts.headerReady = function (e) {
            // read cookies
            _readCookies(client, e.response);
            if (options.headerReady) {
                options.headerReady(e);
            }
        };
        opts.bodyReady = options.bodyReady || function () {};
        opts.error = options.error || function () {};

        // create response
        opts.response = http.createResponse();
        opts.response.time = 0;
        opts.response.flashApi = client.socketPool.flashApi;
        opts.request.flashApi = client.socketPool.flashApi;

        // create abort function
        opts.request.abort = function () {
            // set aborted, clear handlers
            opts.request.aborted = true;
            opts.connected = function () {};
            opts.closed = function () {};
            opts.headerReady = function () {};
            opts.bodyReady = function () {};
            opts.error = function () {};
        };

        // add cookies to request
        _writeCookies(client, opts.request);

        // queue request options if there are no idle sockets
        if (client.idle.length === 0) {
            client.requests.push(opts);
        } else {
            // use an idle socket, prefer an idle *connected* socket first
            let socket = null;
            const len = client.idle.length;
            for (let i = 0; is.null(socket) && i < len; ++i) {
                socket = client.idle[i];
                if (socket.isConnected()) {
                    client.idle.splice(i, 1);
                } else {
                    socket = null;
                }
            }
            // no connected socket available, get unconnected socket
            if (is.null(socket)) {
                socket = client.idle.pop();
            }
            socket.options = opts;
            _doRequest(client, socket);
        }
    };

    /**
     * Destroys this client.
     */
    client.destroy = function () {
    // clear pending requests, close and destroy sockets
        client.requests = [];
        for (let i = 0; i < client.sockets.length; ++i) {
            client.sockets[i].close();
            client.sockets[i].destroy();
        }
        client.socketPool = null;
        client.sockets = [];
        client.idle = [];
    };

    /**
     * Sets a cookie for use with all connections made by this client. Any
     * cookie with the same name will be replaced. If the cookie's value
     * is undefined, null, or the blank string, the cookie will be removed.
     *
     * If the cookie's domain doesn't match this client's url host or the
     * cookie's secure flag doesn't match this client's url scheme, then
     * setting the cookie will fail with an exception.
     *
     * @param cookie the cookie with parameters:
     *   name: the name of the cookie.
     *   value: the value of the cookie.
     *   comment: an optional comment string.
     *   maxAge: the age of the cookie in seconds relative to created time.
     *   secure: true if the cookie must be sent over a secure protocol.
     *   httpOnly: true to restrict access to the cookie from javascript
     *     (inaffective since the cookies are stored in javascript).
     *   path: the path for the cookie.
     *   domain: optional domain the cookie belongs to (must start with dot).
     *   version: optional version of the cookie.
     *   created: creation time, in UTC seconds, of the cookie.
     */
    client.setCookie = function (cookie) {
        let rval;
        if (!is.undefined(cookie.name)) {
            if (is.null(cookie.value) || is.undefined(cookie.value) ||
        cookie.value === "") {
                // remove cookie
                rval = client.removeCookie(cookie.name, cookie.path);
            } else {
                // set cookie defaults
                cookie.comment = cookie.comment || "";
                cookie.maxAge = cookie.maxAge || 0;
                cookie.secure = (is.undefined(cookie.secure)) ?
                    true : cookie.secure;
                cookie.httpOnly = cookie.httpOnly || true;
                cookie.path = cookie.path || "/";
                cookie.domain = cookie.domain || null;
                cookie.version = cookie.version || null;
                cookie.created = _getUtcTime(new Date());

                // do secure check
                if (cookie.secure !== client.secure) {
                    var error = new Error("Http client url scheme is incompatible " +
            "with cookie secure flag.");
                    error.url = client.url;
                    error.cookie = cookie;
                    throw error;
                }
                // make sure url host is within cookie.domain
                if (!http.withinCookieDomain(client.url, cookie)) {
                    var error = new Error("Http client url scheme is incompatible " +
            "with cookie secure flag.");
                    error.url = client.url;
                    error.cookie = cookie;
                    throw error;
                }

                // add new cookie
                if (!(cookie.name in client.cookies)) {
                    client.cookies[cookie.name] = {};
                }
                client.cookies[cookie.name][cookie.path] = cookie;
                rval = true;

                // save cookies
                _saveCookies(client);
            }
        }

        return rval;
    };

    /**
     * Gets a cookie by its name.
     *
     * @param name the name of the cookie to retrieve.
     * @param path an optional path for the cookie (if there are multiple
     *          cookies with the same name but different paths).
     *
     * @return the cookie or null if not found.
     */
    client.getCookie = function (name, path) {
        let rval = null;
        if (name in client.cookies) {
            const paths = client.cookies[name];

            // get path-specific cookie
            if (path) {
                if (path in paths) {
                    rval = paths[path];
                }
            } else {
                // get first cookie
                for (const p in paths) {
                    rval = paths[p];
                    break;
                }
            }
        }
        return rval;
    };

    /**
     * Removes a cookie.
     *
     * @param name the name of the cookie to remove.
     * @param path an optional path for the cookie (if there are multiple
     *          cookies with the same name but different paths).
     *
     * @return true if a cookie was removed, false if not.
     */
    client.removeCookie = function (name, path) {
        let rval = false;
        if (name in client.cookies) {
            // delete the specific path
            if (path) {
                const paths = client.cookies[name];
                if (path in paths) {
                    rval = true;
                    delete client.cookies[name][path];
                    // clean up entry if empty
                    let empty = true;
                    for (const i in client.cookies[name]) {
                        empty = false;
                        break;
                    }
                    if (empty) {
                        delete client.cookies[name];
                    }
                }
            } else {
                // delete all cookies with the given name
                rval = true;
                delete client.cookies[name];
            }
        }
        if (rval) {
            // save cookies
            _saveCookies(client);
        }
        return rval;
    };

    /**
     * Clears all cookies stored in this client.
     */
    client.clearCookies = function () {
        client.cookies = {};
        _clearCookies(client);
    };

    if (forge.log) {
        forge.log.debug("forge.http", "created client", options);
    }

    return client;
};

/**
 * Trims the whitespace off of the beginning and end of a string.
 *
 * @param str the string to trim.
 *
 * @return the trimmed string.
 */
const _trimString = function (str) {
    return str.replace(/^\s*/, "").replace(/\s*$/, "");
};

/**
 * Creates an http header object.
 *
 * @return the http header object.
 */
const _createHeader = function () {
    var header = {
        fields: {},
        setField(name, value) {
            // normalize field name, trim value
            header.fields[_normalize(name)] = [_trimString(`${value}`)];
        },
        appendField(name, value) {
            name = _normalize(name);
            if (!(name in header.fields)) {
                header.fields[name] = [];
            }
            header.fields[name].push(_trimString(`${value}`));
        },
        getField(name, index) {
            let rval = null;
            name = _normalize(name);
            if (name in header.fields) {
                index = index || 0;
                rval = header.fields[name][index];
            }
            return rval;
        }
    };
    return header;
};

/**
 * Gets the time in utc seconds given a date.
 *
 * @param d the date to use.
 *
 * @return the time in utc seconds.
 */
var _getUtcTime = function (d) {
    const utc = Number(d) + d.getTimezoneOffset() * 60000;
    return Math.floor(Number(new Date()) / 1000);
};

/**
 * Creates an http request.
 *
 * @param options:
 *          version: the version.
 *          method: the method.
 *          path: the path.
 *          body: the body.
 *          headers: custom header fields to add,
 *            eg: [{'Content-Length': 0}].
 *
 * @return the http request.
 */
http.createRequest = function (options) {
    options = options || {};
    const request = _createHeader();
    request.version = options.version || "HTTP/1.1";
    request.method = options.method || null;
    request.path = options.path || null;
    request.body = options.body || null;
    request.bodyDeflated = false;
    request.flashApi = null;

    // add custom headers
    let headers = options.headers || [];
    if (!forge.util.isArray(headers)) {
        headers = [headers];
    }
    for (let i = 0; i < headers.length; ++i) {
        for (const name in headers[i]) {
            request.appendField(name, headers[i][name]);
        }
    }

    /**
     * Adds a cookie to the request 'Cookie' header.
     *
     * @param cookie a cookie to add.
     */
    request.addCookie = function (cookie) {
        let value = "";
        const field = request.getField("Cookie");
        if (!is.null(field)) {
            // separate cookies by semi-colons
            value = `${field}; `;
        }

        // get current time in utc seconds
        const now = _getUtcTime(new Date());

        // output cookie name and value
        value += `${cookie.name}=${cookie.value}`;
        request.setField("Cookie", value);
    };

    /**
     * Converts an http request into a string that can be sent as an
     * HTTP request. Does not include any data.
     *
     * @return the string representation of the request.
     */
    request.toString = function () {
    /* Sample request header:
      GET /some/path/?query HTTP/1.1
      Host: www.someurl.com
      Connection: close
      Accept-Encoding: deflate
      Accept: image/gif, text/html
      User-Agent: Mozilla 4.0
     */

        // set default headers
        if (is.null(request.getField("User-Agent"))) {
            request.setField("User-Agent", "forge.http 1.0");
        }
        if (is.null(request.getField("Accept"))) {
            request.setField("Accept", "*/*");
        }
        if (is.null(request.getField("Connection"))) {
            request.setField("Connection", "keep-alive");
            request.setField("Keep-Alive", "115");
        }

        // add Accept-Encoding if not specified
        if (!is.null(request.flashApi) &&
      is.null(request.getField("Accept-Encoding"))) {
            request.setField("Accept-Encoding", "deflate");
        }

        // if the body isn't null, deflate it if its larger than 100 bytes
        if (!is.null(request.flashApi) && !is.null(request.body) &&
      is.null(request.getField("Content-Encoding")) &&
      !request.bodyDeflated && request.body.length > 100) {
            // use flash to compress data
            request.body = forge.util.deflate(request.flashApi, request.body);
            request.bodyDeflated = true;
            request.setField("Content-Encoding", "deflate");
            request.setField("Content-Length", request.body.length);
        } else if (!is.null(request.body)) {
            // set content length for body
            request.setField("Content-Length", request.body.length);
        }

        // build start line
        let rval =
      `${request.method.toUpperCase()} ${request.path} ${ 
          request.version}\r\n`;

        // add each header
        for (const name in request.fields) {
            const fields = request.fields[name];
            for (let i = 0; i < fields.length; ++i) {
                rval += `${name}: ${fields[i]}\r\n`;
            }
        }
        // final terminating CRLF
        rval += "\r\n";

        return rval;
    };

    return request;
};

/**
 * Creates an empty http response header.
 *
 * @return the empty http response header.
 */
http.createResponse = function () {
    // private vars
    let _first = true;
    let _chunkSize = 0;
    let _chunksFinished = false;

    // create response
    const response = _createHeader();
    response.version = null;
    response.code = 0;
    response.message = null;
    response.body = null;
    response.headerReceived = false;
    response.bodyReceived = false;
    response.flashApi = null;

    /**
     * Reads a line that ends in CRLF from a byte buffer.
     *
     * @param b the byte buffer.
     *
     * @return the line or null if none was found.
     */
    const _readCrlf = function (b) {
        let line = null;
        const i = b.data.indexOf("\r\n", b.read);
        if (i != -1) {
            // read line, skip CRLF
            line = b.getBytes(i - b.read);
            b.getBytes(2);
        }
        return line;
    };

    /**
     * Parses a header field and appends it to the response.
     *
     * @param line the header field line.
     */
    const _parseHeader = function (line) {
        let tmp = line.indexOf(":");
        const name = line.substring(0, tmp++);
        response.appendField(
            name, (tmp < line.length) ? line.substring(tmp) : "");
    };

    /**
     * Reads an http response header from a buffer of bytes.
     *
     * @param b the byte buffer to parse the header from.
     *
     * @return true if the whole header was read, false if not.
     */
    response.readHeader = function (b) {
    // read header lines (each ends in CRLF)
        let line = "";
        while (!response.headerReceived && !is.null(line)) {
            line = _readCrlf(b);
            if (!is.null(line)) {
                // parse first line
                if (_first) {
                    _first = false;
                    const tmp = line.split(" ");
                    if (tmp.length >= 3) {
                        response.version = tmp[0];
                        response.code = parseInt(tmp[1], 10);
                        response.message = tmp.slice(2).join(" ");
                    } else {
                        // invalid header
                        const error = new Error("Invalid http response header.");
                        error.details = { line };
                        throw error;
                    }
                } else if (line.length === 0) {
                    // handle final line, end of header
                    response.headerReceived = true;
                } else {
                    _parseHeader(line);
                }
            }
        }

        return response.headerReceived;
    };

    /**
     * Reads some chunked http response entity-body from the given buffer of
     * bytes.
     *
     * @param b the byte buffer to read from.
     *
     * @return true if the whole body was read, false if not.
     */
    const _readChunkedBody = function (b) {
    /**
     * Chunked transfer-encoding sends data in a series of chunks,
     * followed by a set of 0-N http trailers.
     * The format is as follows:
     *
     * chunk-size (in hex) CRLF
     * chunk data (with "chunk-size" many bytes) CRLF
     * ... (N many chunks)
     * chunk-size (of 0 indicating the last chunk) CRLF
     * N many http trailers followed by CRLF
     * blank line + CRLF (terminates the trailers)
     *
     * If there are no http trailers, then after the chunk-size of 0,
     * there is still a single CRLF (indicating the blank line + CRLF
     * that terminates the trailers). In other words, you always terminate
     */

        /**
         * From RFC-2616, section 3.6.1, here is the pseudo-code for
         * implementing chunked transfer-encoding:
         *
         * length := 0
         * read chunk-size, chunk-extension (if any) and CRLF
         * while (chunk-size > 0) {
         * read chunk-data and CRLF
         * append chunk-data to entity-body
         * length := length + chunk-size
         * read chunk-size and CRLF
         * }
         * read entity-header
         * while (entity-header not empty) {
         * append entity-header to existing header fields
         * read entity-header
         * }
         * Content-Length := length
         * Remove "chunked" from Transfer-Encoding
         */

        let line = "";
        while (!is.null(line) && b.length() > 0) {
            // if in the process of reading a chunk
            if (_chunkSize > 0) {
                // if there are not enough bytes to read chunk and its
                // trailing CRLF,  we must wait for more data to be received
                if (_chunkSize + 2 > b.length()) {
                    break;
                }

                // read chunk data, skip CRLF
                response.body += b.getBytes(_chunkSize);
                b.getBytes(2);
                _chunkSize = 0;
            } else if (!_chunksFinished) {
                // more chunks, read next chunk-size line
                line = _readCrlf(b);
                if (!is.null(line)) {
                    // parse chunk-size (ignore any chunk extension)
                    _chunkSize = parseInt(line.split(";", 1)[0], 16);
                    _chunksFinished = (_chunkSize === 0);
                }
            } else {
                // chunks finished, read next trailer
                line = _readCrlf(b);
                while (!is.null(line)) {
                    if (line.length > 0) {
                        // parse trailer
                        _parseHeader(line);
                        // read next trailer
                        line = _readCrlf(b);
                    } else {
                        // body received
                        response.bodyReceived = true;
                        line = null;
                    }
                }
            }
        }

        return response.bodyReceived;
    };

    /**
     * Reads an http response body from a buffer of bytes.
     *
     * @param b the byte buffer to read from.
     *
     * @return true if the whole body was read, false if not.
     */
    response.readBody = function (b) {
        let contentLength = response.getField("Content-Length");
        const transferEncoding = response.getField("Transfer-Encoding");
        if (!is.null(contentLength)) {
            contentLength = parseInt(contentLength);
        }

        // read specified length
        if (!is.null(contentLength) && contentLength >= 0) {
            response.body = response.body || "";
            response.body += b.getBytes(contentLength);
            response.bodyReceived = (response.body.length === contentLength);
        } else if (!is.null(transferEncoding)) {
            // read chunked encoding
            if (transferEncoding.indexOf("chunked") != -1) {
                response.body = response.body || "";
                _readChunkedBody(b);
            } else {
                const error = new Error("Unknown Transfer-Encoding.");
                error.details = { transferEncoding };
                throw error;
            }
        } else if ((!is.null(contentLength) && contentLength < 0) ||
      (is.null(contentLength) &&
      !is.null(response.getField("Content-Type")))) {
            // read all data in the buffer
            response.body = response.body || "";
            response.body += b.getBytes();
            response.readBodyUntilClose = true;
        } else {
            // no body
            response.body = null;
            response.bodyReceived = true;
        }

        if (response.bodyReceived) {
            response.time = Number(new Date()) - response.time;
        }

        if (!is.null(response.flashApi) &&
      response.bodyReceived && !is.null(response.body) &&
      response.getField("Content-Encoding") === "deflate") {
            // inflate using flash api
            response.body = forge.util.inflate(
                response.flashApi, response.body);
        }

        return response.bodyReceived;
    };

    /**
     * Parses an array of cookies from the 'Set-Cookie' field, if present.
     *
     * @return the array of cookies.
     */
    response.getCookies = function () {
        const rval = [];

        // get Set-Cookie field
        if ("Set-Cookie" in response.fields) {
            const field = response.fields["Set-Cookie"];

            // get current local time in seconds
            const now = Number(new Date()) / 1000;

            // regex for parsing 'name1=value1; name2=value2; name3'
            const regex = /\s*([^=]*)=?([^;]*)(;|$)/g;

            // examples:
            // Set-Cookie: cookie1_name=cookie1_value; max-age=0; path=/
            // Set-Cookie: c2=v2; expires=Thu, 21-Aug-2008 23:47:25 GMT; path=/
            for (let i = 0; i < field.length; ++i) {
                const fv = field[i];
                var m;
                regex.lastIndex = 0;
                let first = true;
                const cookie = {};
                do {
                    m = regex.exec(fv);
                    if (!is.null(m)) {
                        let name = _trimString(m[1]);
                        let value = _trimString(m[2]);

                        // cookie_name=value
                        if (first) {
                            cookie.name = name;
                            cookie.value = value;
                            first = false;
                        } else {
                            // property_name=value
                            name = name.toLowerCase();
                            switch (name) {
                                case "expires":
                                    // replace hyphens w/spaces so date will parse
                                    value = value.replace(/-/g, " ");
                                    var secs = Date.parse(value) / 1000;
                                    cookie.maxAge = Math.max(0, secs - now);
                                    break;
                                case "max-age":
                                    cookie.maxAge = parseInt(value, 10);
                                    break;
                                case "secure":
                                    cookie.secure = true;
                                    break;
                                case "httponly":
                                    cookie.httpOnly = true;
                                    break;
                                default:
                                    if (name !== "") {
                                        cookie[name] = value;
                                    }
                            }
                        }
                    }
                } while (!is.null(m) && m[0] !== "");
                rval.push(cookie);
            }
        }

        return rval;
    };

    /**
     * Converts an http response into a string that can be sent as an
     * HTTP response. Does not include any data.
     *
     * @return the string representation of the response.
     */
    response.toString = function () {
    /**
     * Sample response header:
     * HTTP/1.0 200 OK
     * Host: www.someurl.com
     * Connection: close
     */

        // build start line
        let rval =
      `${response.version} ${response.code} ${response.message}\r\n`;

        // add each header
        for (const name in response.fields) {
            const fields = response.fields[name];
            for (let i = 0; i < fields.length; ++i) {
                rval += `${name}: ${fields[i]}\r\n`;
            }
        }
        // final terminating CRLF
        rval += "\r\n";

        return rval;
    };

    return response;
};

/**
 * Parses the scheme, host, and port from an http(s) url.
 *
 * @param str the url string.
 *
 * @return the parsed url object or null if the url is invalid.
 */
http.parseUrl = forge.util.parseUrl;

/**
 * Returns true if the given url is within the given cookie's domain.
 *
 * @param url the url to check.
 * @param cookie the cookie or cookie domain to check.
 */
http.withinCookieDomain = function (url, cookie) {
    let rval = false;

    // cookie may be null, a cookie object, or a domain string
    const domain = (is.null(cookie) || is.string(cookie)) ?
        cookie : cookie.domain;

    // any domain will do
    if (is.null(domain)) {
        rval = true;
    } else if (domain.charAt(0) === ".") {
    // ensure domain starts with a '.'
    // parse URL as necessary
        if (is.string(url)) {
            url = http.parseUrl(url);
        }

        // add '.' to front of URL host to match against domain
        const host = `.${url.host}`;

        // if the host ends with domain then it falls within it
        const idx = host.lastIndexOf(domain);
        if (idx !== -1 && (idx + domain.length === host.length)) {
            rval = true;
        }
    }

    return rval;
};