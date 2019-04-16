const {
    app: { lockfile },
    error,
    is,
    fs,
    realm,
    task,
    std,
    util
} = adone;

const checkEntry = (entry) => {
    if (is.nil(entry.dst)) {
        return false;
    }

    if (!is.string(entry.task)) {
        entry.task = "copy";
    }

    return true;
};

const trySuperRealmAt = (cwd) => {
    let superRealm = new realm.RealmManager({
        cwd
    });
    try {
        // Validation...

        // try to require realm config
        require(std.path.join(superRealm.cwd, ".adone", "config.json"));

        // try to require package.json
        require(std.path.join(superRealm.cwd, "package.json"));
    } catch (err) {
        superRealm = null;
    }
    return superRealm;
};

const COMMON_FILENAMES = [
    "bin",
    "run",
    "etc",
    "opt",
    "var",
    "share",
    "lib",
    "src",
    [".adone", "special"],
    "tests",
    "tmp",
    ["node_modules", "modules"],
    ["realm.lock", "lockfile"],
    ["package.json", "package"],
    ["shanifile.js", "shanifile"],
    "LICENSE",
    ["README.md", "readme"]
].map((v) => is.string(v) ? [v, v] : v);

export default class RealmManager extends task.TaskManager {
    #connected = false;

    #connectiong = false;

    #superRealm = null;

    #artifacts = [];

    constructor({ cwd = process.cwd() } = {}) {
        super();

        if (!is.string(cwd)) {
            throw new error.NotValidException(`Invalid type of cwd: ${adone.typeOf(cwd)}`);
        }
        this.cwd = cwd;

        this.config = realm.Configuration.loadSync({
            cwd
        });

        adone.lazify({
            devConfig: () => {
                let cfg;
                try {
                    cfg = realm.DevConfiguration.loadSync({
                        cwd
                    });
                } catch (err) {
                    cfg = null;
                }
                return cfg;
            }
        }, this)

        this.package = require(std.path.join(cwd, "package.json"));

        // Scan for super realm
        const parentPath = std.path.dirname(this.cwd);
        const baseName = std.path.basename(parentPath);
        if (baseName === "opt") {
            this.#superRealm = trySuperRealmAt(std.path.dirname(parentPath));
        }
        // check 'dev' section for merge information
        if (is.null(this.#superRealm)) {
            try {
                const devConfig = adone.realm.DevConfiguration.loadSync({
                    cwd
                });

                if (is.string(devConfig.raw.superRealm)) {
                    this.#superRealm = trySuperRealmAt(devConfig.raw.superRealm);
                }
            } catch (err) {
                //
            }
        }
    }

    get name() {
        return this.package.name;
    }

    get connected() {
        return this.#connected;
    }

    get superRealm() {
        return this.#superRealm;
    }

    async connect({ transpile } = {}) {
        if (this.#connected || this.#connectiong) {
            return;
        }
        this.#connectiong = true;

        try {
            if (!is.null(this.superRealm)) {
                await this.superRealm.connect({ transpile });
            }

            const tasksConfig = this.config.raw.tasks;
            if (is.object(tasksConfig) && is.string(tasksConfig.basePath)) {
                const tasksBasePath = this.getPath(tasksConfig.basePath);

                if (fs.existsSync(tasksBasePath)) {
                    if (is.object(tasksConfig.tags)) {
                        for (const [tag, path] of Object.entries(tasksConfig.tags)) {
                            await this.loadTasksFrom(std.path.join(tasksBasePath, path), {
                                transpile,
                                tag
                            });
                        }
                    }
                }

                if (tasksConfig.default !== false) {
                    const ignore = is.object(tasksConfig.tags)
                        ? [...Object.values(tasksConfig.tags)]
                        : [];
                    await this.loadTasksFrom(tasksBasePath, {
                        transpile,
                        ignore
                    });
                }
            }

            // // Add self contained tasks
            // for (const [tag, tasks] of Object.entries(tags)) {
            //     for (const [name, TaskClass] of Object.entries(tasks)) {
            //         // eslint-disable-next-line no-await-in-loop
            //         await this.addTask({
            //             name,
            //             task: TaskClass,
            //             tag
            //         });
            //     }
            // }

            // Add all public tasks from all super realms.
            if (!is.null(this.superRealm)) {
                await this.#addTasksFromSuperRealm(this.superRealm);
            }

            // ROOT_PATH
            this.#definePathVar("root", this.cwd);
            // console.log(this.cwd);

            // collect artifacts
            const rootFiles = await fs.readdir(this.cwd);
            const cfgArtifacts = this.config.get("artifacts") || {};
            const customArtifacts = Object.keys(cfgArtifacts);

            for (const file of rootFiles) {
                const fullPath = std.path.join(this.cwd, file);
                const artifact = {
                    path: file,
                    attrs: new Set([(await fs.isDirectory(fullPath))
                        ? "dir"
                        : "file"])
                };

                const item = COMMON_FILENAMES.find((v) => v[0] === file);

                if (item) {
                    this.#definePathVar(item[1], fullPath);

                    artifact.attrs.add("common");
                }

                for (const ca of customArtifacts) {
                    if (cfgArtifacts[ca].includes(file)) {
                        artifact.attrs.add(ca);
                    }
                }

                this.#artifacts.push(artifact);
            }

            // Add default type handlers
            // const handlerNames = (await adone.fs.readdir(std.path.join(__dirname, "handlers"))).filter((name) => name.endsWith(".js"));
            // const handlers = {};

            // for (const name of handlerNames) {
            //     handlers[std.path.basename(name, ".js").replace(/_/g, ".")] = `.${adone.std.path.sep}${std.path.join("handlers", name)}`;
            // }

            // this.typeHandler = adone.lazify(handlers, null, require);
            this.#connected = true;
        } catch (err) {
            this.#connected = false;
            throw err;
        } finally {
            this.#connectiong = false;
        }
    }

    #definePathVar(prefix, value) {
        Object.defineProperty(this, `${prefix.toUpperCase()}_PATH`, {
            enumerable: true,
            value
        });
    }

    getPath(...args) {
        return std.path.join(this.cwd, ...args);
    }

    getArtifacts(attr) {
        const artifacts = [];
        const attrs = util.arrify(attr);

        for (const info of this.#artifacts) {
            if (attrs.reduce((sum, item) => sum + (info.attrs.has(item) ? 1 : 0), 0) === attrs.length) {
                artifacts.push(info);
            }
        }

        return artifacts;
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

    // addTypeHandler(typeName, handler) {
    // }

    // getTypeHandler(typeName) {
    //     const HandlerClass = this.typeHandler[typeName];

    //     if (!is.class(HandlerClass)) {
    //         throw new error.NotSupportedException(`Unsupported type: ${typeName}`);
    //     }

    //     return new HandlerClass(this);
    // }

    // getAllTypeHandlers() {
    //     return Object.keys(this.typeHandler).map((name) => {
    //         const THClass = this.typeHandler[name];
    //         return new THClass(this);
    //     });
    // }

    // registerComponent(adoneConf, destPath) {
    //     return this.getTypeHandler(adoneConf.raw.type).register(adoneConf, destPath);
    // }

    // unregisterComponent(adoneConf) {
    //     return this.getTypeHandler(adoneConf.raw.type).unregister(adoneConf);
    // }

    async run(name, ...args) {
        try {
            const result = await super.run(name, ...args);
            return result;
        } catch (err) {
            if (err instanceof error.NotExistsException && !is.null(this.superRealm)) {
                return this.superRealm.run(name, ...args);
            }
            throw err;
        }
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

    async #addTasksFromSuperRealm(superRealm) {
        if (is.null(superRealm)) {
            return;
        }
        const tasks = superRealm.getTasksByTag(realm.TAG.PUB);
        for (const taskInfo of tasks) {
            if (!this.hasTask(taskInfo.name)) {
                // eslint-disable-next-line no-await-in-loop
                await this.addTask({
                    name: taskInfo.name,
                    task: taskInfo.Class,
                    ...util.pick(taskInfo, ["concurrency", "interval", "singleton", "description", "tag"])
                });
            }
        }

        return this.#addTasksFromSuperRealm(superRealm.superRealm);
    }
}
