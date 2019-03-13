const {
    app: { lockfile },
    error,
    is,
    fs,
    realm,
    task,
    std
} = adone;

const INITIALIZED = Symbol();

const checkEntry = (entry) => {
    if (is.nil(entry.dst)) {
        return false;
    }

    if (!is.string(entry.task)) {
        entry.task = "copy";
    }

    return true;
};

const loadTasks = (path, index) => {
    let indexFile;
    if (is.string(index)) {
        indexFile = index;
    } else {
        indexFile = "index.js";
    }
    const fullPath = std.path.join(path, indexFile);
    if (fs.existsSync(fullPath)) {
        const mod = adone.require(fullPath);
        return mod.default
            ? mod.default
            : mod;
    }
    return {};
};

export default class RealmManager extends task.Manager {
    constructor({ cwd = process.cwd() } = {}) {
        super();

        if (!is.string(cwd)) {
            throw new error.NotValidException(`Invalid type of cwd: ${adone.typeOf(cwd)}`);
        }
        this.cwd = cwd;

        this.ROOT_PATH = std.path.join(cwd);
        this.BIN_PATH = std.path.join(cwd, "bin");
        this.RUNTIME_PATH = std.path.join(cwd, "run");
        this.ETC_PATH = std.path.join(cwd, "etc");
        this.OPT_PATH = std.path.join(cwd, "opt");
        this.VAR_PATH = std.path.join(cwd, "var");
        this.SHARE_PATH = std.path.join(cwd, "share");
        this.LOGS_PATH = std.path.join(cwd, "var", "logs");
        this.REALMS_PATH = std.path.join(cwd, "realms");
        this.PACKAGES_PATH = std.path.join(cwd, "packages");
        this.LOCKFILE_PATH = std.path.join(cwd, "realm.lock");

        adone.lazify({
            config: () => {
                const conf = realm.Configuration.loadSync({
                    cwd
                });

                return conf;
            },
            tasks: () => {
                let tasks = {};
                if (is.object(this.config.raw.tasks) && is.string(this.config.raw.tasks.basePath)) {
                    const basePath = std.path.join(this.cwd, this.config.raw.tasks.basePath);
                    if (fs.existsSync(basePath)) {
                        tasks = {
                            ...loadTasks(basePath, this.config.raw.tasks.index),
                            ...loadTasks(basePath, this.config.raw.tasks.indexDev)
                        };
                    }
                }

                return tasks;
            },
            package: std.path.join(cwd, "package.json"),
            identity: std.path.join(cwd, ".adone", "identity.json") // remove (adone specific)
        }, this);

        this.typeHandler = null;
        // this.peerInfo = null;
        this[INITIALIZED] = false;
    }

    get initialized() {
        return this[INITIALIZED];
    }

    async initialize() {
        if (this[INITIALIZED]) {
            return;
        }
        this[INITIALIZED] = true;

        // Load realm tasks
        try {
            const tasks = this.tasks;
            for (const [name, TaskClass] of Object.entries(tasks)) {
                // eslint-disable-next-line no-await-in-loop
                await this.addTask(name, TaskClass);
            }
        } catch (err) {
            //
        }

        // Add default type handlers
        const handlerNames = (await adone.fs.readdir(std.path.join(__dirname, "handlers"))).filter((name) => name.endsWith(".js"));
        const handlers = {};

        for (const name of handlerNames) {
            handlers[std.path.basename(name, ".js").replace(/_/g, ".")] = `.${adone.std.path.sep}${std.path.join("handlers", name)}`;
        }

        this.typeHandler = adone.lazify(handlers, null, require);
    }

    getEntries({ path, onlyNative = false, excludeVirtual = true } = {}) {
        let entries = this.config.getEntries(path);

        if (onlyNative) {
            const result = [];
            for (const entry of entries) {
                if (is.plainObject(entry.native)) {
                    result.push(entry);
                }
            }

            entries = result;
        }

        return excludeVirtual
            ? entries.filter(checkEntry)
            : entries;
    }

    addTypeHandler(typeName, handler) {
    }

    getTypeHandler(typeName) {
        const HandlerClass = this.typeHandler[typeName];

        if (!is.class(HandlerClass)) {
            throw new error.NotSupportedException(`Unsupported type: ${typeName}`);
        }

        return new HandlerClass(this);
    }

    getAllTypeHandlers() {
        return Object.keys(this.typeHandler).map((name) => {
            const THClass = this.typeHandler[name];
            return new THClass(this);
        });
    }

    registerComponent(adoneConf, destPath) {
        return this.getTypeHandler(adoneConf.raw.type).register(adoneConf, destPath);
    }

    unregisterComponent(adoneConf) {
        return this.getTypeHandler(adoneConf.raw.type).unregister(adoneConf);
    }

    async runSafe(name, ...args) {
        await this.lock();
        const observer = await this.run(name, ...args);
        await observer.finally(() => this.unlock());
        return observer;
    }

    async lock() {
        return lockfile.create(this.ROOT_PATH, {
            lockfilePath: this.LOCKFILE_PATH
        });
    }

    async unlock() {
        const options = {
            lockfilePath: this.LOCKFILE_PATH
        };
        if (await lockfile.check(this.ROOT_PATH, options)) {
            return lockfile.release(this.ROOT_PATH, options);
        }
    }
}
