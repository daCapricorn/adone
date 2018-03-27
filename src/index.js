Object.defineProperty(exports, "__esModule", {
    value: true
});

if (!Object.prototype.hasOwnProperty.call(global, "adone")) {
    const NAMESPACE_SYMBOL = Symbol.for("adone:namespace");
    const PRIVATE_SYMBOL = Symbol.for("adone:private");

    const asNamespace = (obj) => {
        obj[NAMESPACE_SYMBOL] = true;
        return obj;
    };

    const TAG_MARKER = 777;
    const tag = {
        add(Class, tagName) {
            Class.prototype[this[tagName]] = TAG_MARKER;
        },
        has(obj, tagName) {
            return obj != null && typeof obj === "object" && this[tagName] !== undefined && obj[this[tagName]] === TAG_MARKER;
        },
        define(tagName) {
            this[tagName] = Symbol();
        },

        // Common tags
        EMITTER: Symbol(),
        ASYNC_EMITTER: Symbol(),
        SUBSYSTEM: Symbol(),
        APPLICATION: Symbol(),
        CLI_APPLICATION: Symbol(),
        CONFIGURATION: Symbol(),
        CORE_STREAM: Symbol(),
        BYTE_ARRAY: Symbol(),
        LONG: Symbol(),
        BIGNUMBER: Symbol(),
        DATETIME: Symbol()
    };

    const adone = Object.create({
        [NAMESPACE_SYMBOL]: true,
        null: Symbol.for("adone::null"),
        noop: () => { },
        identity: (x) => x,
        truly: () => true,
        falsely: () => false,
        ok: "ok",
        bad: "bad",
        log: (...args) => adone.runtime.logger.stdoutLogNoFmt(...args),
        logFatal: (...args) => adone.runtime.logger.fatal(...args),
        logError: (...args) => adone.runtime.logger.error(...args),
        logWarn: (...args) => adone.runtime.logger.warn(...args),
        logInfo: (...args) => adone.runtime.logger.info(...args),
        logDebug: (...args) => adone.runtime.logger.debug(...args),
        logTrace: (...args) => adone.runtime.logger.trace(...args),
        o: (...props) => props.length > 0 ? Object.assign({}, ...props) : {},
        Date: global.Date,
        hrtime: process.hrtime,
        setTimeout: global.setTimeout,
        clearTimeout: global.clearTimeout,
        setInterval: global.setInterval,
        clearInterval: global.clearInterval,
        setImmediate: global.setImmediate,
        clearImmediate: global.clearImmediate,
        lazify: (modules, _obj, _require = require, {
            configurable = false,
            writable = false,
            mapper = (key, mod) => ((mod !== null && typeof mod === "object" && mod.__esModule === true && "default" in mod) ? mod.default : mod)
        } = {}) => {
            const obj = _obj || {};
            Object.keys(modules).forEach((key) => {
                Object.defineProperty(obj, key, {
                    configurable: true,
                    enumerable: true,
                    get() {
                        const value = modules[key];

                        let mod;
                        if (typeof value === "function") { // eslint-disable-line
                            mod = value(key);
                        } else if (typeof value === "string") { // eslint-disable-line
                            mod = _require(value);
                        } else if (Array.isArray(value) && value.length >= 1 && typeof value[0] === "string") { // eslint-disable-line
                            mod = value.reduce((mod, entry, i) => {
                                if (typeof entry === "function") { // eslint-disable-line
                                    return entry(mod);
                                } else if (typeof entry === "string") { // eslint-disable-line
                                    if (!(entry in mod)) {
                                        throw new Error(`Invalid parameter name in ${key}[${i + 1}]`);
                                    }
                                    return mod[entry];
                                }
                                throw new TypeError(`Invalid type at ${key}[${i + 1}]`);
                            }, _require(value.shift()));
                        } else {
                            throw new TypeError(`Invalid module type of ${key}`);
                        }

                        mod = mapper(key, mod);

                        Object.defineProperty(obj, key, {
                            configurable,
                            enumerable: true,
                            writable,
                            value: mod
                        });

                        return mod;
                    }
                });
            });

            return obj;
        },
        lazifyPrivate: (modules, obj, _require = require, options) => {
            if (adone.is.plainObject(obj[PRIVATE_SYMBOL])) {
                return adone.lazify(modules, obj[PRIVATE_SYMBOL], _require, options);
            }

            obj[PRIVATE_SYMBOL] = adone.lazify(modules, null, _require, options);
            return obj[PRIVATE_SYMBOL];
        },
        definePrivate: (modules, obj) => {
            if (adone.is.plainObject(obj[PRIVATE_SYMBOL])) {
                Object.assign(obj[PRIVATE_SYMBOL], modules);
            } else {
                obj[PRIVATE_SYMBOL] = modules;
            }

            return obj;
        },
        definePredicate: (name, tagName) => {
            Object.defineProperty(adone.is, name, {
                enumerable: true,
                value: (obj) => tag.has(obj, tagName)
            });
            tag.define(tagName);
        },
        definePredicates: (obj) => {
            const entries = Object.entries(obj);
            for (const [name, tagName] of entries) {
                adone.definePredicate(name, tagName);
            }
        },
        defineCustomPredicate: (name, value) => {
            Object.defineProperty(adone.is, name, {
                enumerable: true,
                value
            });
        },
        private: (obj) => obj[PRIVATE_SYMBOL],
        asNamespace,
        tag,
        // TODO: allow only absolute path
        nativeAddon: (path) => {
            return require(adone.std.path.isAbsolute(path) ? path : adone.std.path.resolve(__dirname, "./native", path));
        },
        getAssetAbsolutePath: (relPath) => adone.std.path.resolve(__dirname, "..", "etc", adone.std.path.normalize(relPath)),
        loadAsset: (relPath) => {
            const extName = adone.std.path.extname(relPath);
            const buf = adone.std.fs.readFileSync(adone.getAssetAbsolutePath(relPath));
            switch (extName) {
                case ".json": {
                    return JSON.parse(buf.toString("utf8"));
                }
                default:
                    return buf;
            }
        }
    });

    exports.adone = adone;

    Object.defineProperty(global, "adone", {
        enumerable: true,
        value: adone
    });

    Object.defineProperties(adone, {
        adone: {
            enumerable: true,
            value: adone
        },
        global: {
            enumerable: true,
            value: asNamespace(global)
        }
    });

    adone.lazify({
        // es2015 require
        require: () => {
            const plugins = [
                "syntax.asyncGenerators",
                "transform.flowStripTypes",
                "transform.decorators",
                ["transform.classProperties", { loose: true }],
                "transform.modulesCommonjs",
                "transform.functionBind",
                "transform.objectRestSpread",
                "transform.numericSeparator",
                "transform.exponentiationOperator"
            ];
            if (process.env.ADONE_COVERAGE) {
                plugins.unshift(
                    "syntax.flow",
                    "syntax.decorators",
                    "syntax.classProperties",
                    "syntax.objectRestSpread",
                    "syntax.functionBind",
                    "syntax.numericSeparator",
                    "syntax.exponentiationOperator",
                    adone.js.coverage.plugin
                );
            }
            const options = {
                compact: false,
                only: [/\.js$/],
                sourceMaps: "inline",
                plugins
            };
            const module = new adone.js.Module(require.main ? require.main.filename : adone.std.path.join(process.cwd(), "index.js"), {
                transform: adone.js.Module.transforms.transpile(options)
            });
            const $require = (path, { transpile = true, cache = true } = {}) => module.require(path, {
                transform: transpile ? module.transform : null,
                cache
            });
            $require.cache = module.cache;
            $require.main = module;
            $require.options = options;
            $require.resolve = (request) => adone.js.Module._resolveFilename(request, module);
            $require.unref = module.cache.unref.bind(module.cache);
            return $require;
        },

        // Adone package
        package: "../package.json",

        // Runtime stuff
        runtime: () => {
            const runtime = Object.create(null, {
                app: {
                    enumerable: true,
                    writable: true,
                    value: null
                },
                realm: {
                    enumerable: true,
                    writable: true,
                    value: {}
                },
                isOmnitron: {
                    enumerable: true,
                    writable: true,
                    value: false
                }
            });

            adone.lazify({
                term: () => new adone.terminal.Terminal(),
                logger: () => adone.application.Logger.default(),
                netron: () => new adone.netron.Netron(),
                netron2: () => {
                    const peerInfo = adone.runtime.isOmnitron
                        ? adone.omnitron2.LOCAL_PEER_INFO
                        : adone.net.p2p.PeerInfo.create(adone.runtime.realm.config.identity.client);
                    return new adone.netron2.Netron(peerInfo);
                }
            }, runtime);

            return runtime;
        },
        ROOT_PATH: () => adone.std.path.join(__dirname, ".."),
        ETC_PATH: () => adone.std.path.join(adone.ROOT_PATH, "etc"),

        EMPTY_BUFFER: () => Buffer.allocUnsafe(0),
        assert: () => adone.assertion.loadAssertInterface().assert,
        expect: () => adone.assertion.loadExpectInterface().expect,

        // Namespaces

        // NodeJS
        std: () => asNamespace(adone.lazify({
            assert: "assert",
            fs: "fs",
            path: "path",
            util: "util",
            events: "events",
            stream: "stream",
            url: "url",
            net: "net",
            http: "http",
            https: "https",
            http2: "http2",
            child_process: "child_process", // eslint-disable-line
            os: "os",
            cluster: "cluster",
            repl: "repl",
            punycode: "punycode",
            readline: "readline",
            string_decoder: "string_decoder",  // eslint-disable-line
            querystring: "querystring",
            crypto: "crypto",
            vm: "vm",
            v8: "v8",
            domain: "domain",
            module: "module",
            tty: "tty",
            buffer: "buffer",
            constants: "constants",
            zlib: "zlib",
            tls: "tls",
            console: "console",
            dns: "dns",
            timers: "timers",
            dgram: "dgram",
            perf_hooks: "perf_hooks"
        })),

        native: () => adone.nativeAddon(adone.std.path.join(__dirname, "native", "common.node")),

        // glosses
        assertion: "./glosses/assertion",
        event: "./glosses/events",
        is: "./glosses/is",
        error: "./glosses/errors",
        application: "./glosses/application",
        configuration: "./glosses/configurations",
        collection: "./glosses/collections",
        compressor: "./glosses/compressors",
        archive: "./glosses/archives",
        crypto: "./glosses/crypto",
        data: "./glosses/data",
        database: "./glosses/databases",
        datastore: "./glosses/datastores",
        diff: "./glosses/diff",
        util: "./glosses/utils",
        datetime: "./glosses/datetime",
        fs: "./glosses/fs",
        js: "./glosses/js",
        punycode: "./glosses/punycode",
        sourcemap: "./glosses/sourcemap",
        uri: "./glosses/uri",
        semver: "./glosses/semver",
        sprintf: "./glosses/text/sprintf",
        text: "./glosses/text",
        terminal: "./glosses/terminal",
        stream: "./glosses/streams",
        templating: "./glosses/templating",
        pretty: "./glosses/pretty",
        promise: "./glosses/promise",
        math: "./glosses/math",
        meta: "./glosses/meta",
        multi: "./glosses/multi",
        net: "./glosses/net",
        netron: "./glosses/netron",
        netron2: "./glosses/netron2",
        metrics: "./glosses/metrics",
        system: "./glosses/system",
        hardware: "./glosses/hardware",
        shell: "./glosses/shell",
        virtualization: "./glosses/virtualization",
        vault: "./glosses/vault",
        netscan: "./glosses/netscan",
        schema: "./glosses/schema",
        geoip: "./glosses/geoip",
        globals: "./glosses/globals",
        notifier: "./glosses/notifier",
        vcs: "./glosses/vcs",
        regex: "./glosses/regex",
        task: "./glosses/tasks",
        odm: "./glosses/odm",
        orm: "./glosses/orm",
        fake: "./glosses/fake",

        // components
        project: "./project",
        realm: "./realm",
        cli: "./cli",
        omnitron: "./omnitron",
        omnitron2: "./omnitron2",
        fast: "./fast",
        shani: "./shani",
        specter: "./specter",
        gyp: "./gyp",
        cmake: "./cmake",
        lodash: "./lodash",
        benchmark: "./benchmark",

        // third parties
        dev: () => {
            let mounts;
            if (adone.fs.existsSync(adone.runtime.realm.config.devmntPath)) {
                mounts = require(adone.runtime.realm.config.devmntPath);
            } else {
                mounts = {};
            }

            return adone.asNamespace(adone.lazify(mounts, null));
        },
        vendor: () => {
            // TODO
            return {};
        },
        npm: "./npm"
    }, adone);
    if (process.env.ADONE_SOURCEMAPS) {
        adone.sourcemap.support(Error).install();
    }
} else {
    exports.adone = global.adone;
}
