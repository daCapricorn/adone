const {
    is,
    fs,
    regex,
    text,
    std: { path },
    vcs: { git },
    terminal,
    fast,
    text: { unicode },
    system: { process: { exec } },
    templating: { nunjucks }
} = adone;

export class Generator {
    constructor() {
        this.templatesPath = path.join(adone.appinstance.adoneEtcPath, "templates");
        this.adoneConfPath = path.join(this.templatesPath, "adone.conf");

        this.gitFiles = [];

        nunjucks.configure("/", {
            autoescape: false
        });
    }

    async generate(name, type, { cwd, dir, editor }) {
        try {
            if (!regex.filename.test(name)) {
                throw new adone.x.Incorrect(`Incorrect filename: ${name}`);
            }

            let basePath;
            if (is.string(cwd)) {
                basePath = path.resolve(cwd);
            } else {
                basePath = process.cwd();
            }
            const fullPath = dir ? path.join(basePath, name, "index.js") : path.join(basePath, `${name}.js`);
            const appRelPath = dir ? path.join(name, "index.js") : `${name}.js`;

            if (dir) {
                if ((await fs.exists(path.dirname(fullPath)))) {
                    throw new adone.x.Exists(`Directory '${path.dirname(fullPath)}' already exists\n`);
                }
            } else {
                if ((await fs.exists(fullPath))) {
                    throw new adone.x.Exists(`File/directory '${fullPath}' already exists\n`);
                }
            }

            await fast.src([`skeletons/${type}.js`], {
                cwd: this.templatesPath
            }).mapIf((x) => x.basename === "app.js", async (x) => {
                x.relative = appRelPath;
                x.contents = Buffer.from(await nunjucks.renderString(x.contents.toString(), {
                    name: `${adone.text.capitalize(name)}Application`
                }));
                return x;
            }).mapIf((x) => x.basename === "miniapp.js", async (x) => {
                x.relative = appRelPath;
                return x;
            }).dest(basePath, {
                produceFiles: true
            }).through((x) => {
                this._logFileCreation(x.relative);
            });

            terminal.print(`{green-fg}Script {bold}'${name}'{/bold} successfully created.{/}\n`);

            this._spawnEditor(fullPath, editor);

            return 0;
        } catch (err) {
            terminal.print(`{red-fg}${err.message}{/}\n`);
            return 1;
        }
    }

    async createProject(name, type, { sourceDir, skipGit, editor, frontend }) {
        let projectPath = null;
        try {
            if (!regex.filename.test(name)) {
                throw new adone.x.Incorrect(`Incorrect name of project: ${name}`);
            }

            projectPath = path.join(process.cwd(), name);

            if ((await fs.exists(projectPath))) {
                throw new adone.x.Exists(`Directory '${name}' already exists`);
            }

            await fs.mkdir(projectPath);

            if (type === "application") {
                type = "app";
            } else if (type === "webapplication") {
                type = "webapp";
            }

            if (is.nil(sourceDir)) {
                sourceDir = "src";
            } else {
                if (path.isAbsolute(sourceDir)) {
                    throw new adone.x.NotValid(`Invalid source directory: ${sourceDir}`);
                }
                sourceDir = path.normalize(sourceDir);
            }

            const projectName = text.capitalize(text.toCamelCase(name));

            switch (type) {
                case "app":
                    await this._createApp(name, projectName, projectPath, { sourceDir, skipGit });
                    break;
                case "webapp":
                    await this._createWebApp(name, projectName, projectPath, { sourceDir, skipGit, frontend });
                    break;
            }

            terminal.print(`{green-fg}Project {bold}'${name}'{/bold} successfully created.{/}\n`);

            this._spawnEditor(projectPath, editor);
            return 0;
        } catch (err) {
            terminal.print(`{red-fg}${err.message}{/}\n`);
            if (!(err instanceof adone.x.Exists) && !is.null(projectPath)) {
                await fs.rm(projectPath);
            }

            return 1;
        }
    }

    async _createApp(name, projectName, projectPath, { sourceDir, skipGit }) {
        this.gitFiles.push("package-lock.json");

        const appRelPath = path.join(sourceDir, "app.js");

        await fast.src(["skeletons/app.js", "common/**/*"], {
            cwd: this.templatesPath
        }).filter((x) => {
            if (x.basename === ".gitignore" && skipGit) {
                return false;
            }
            return true;
        }).mapIf((x) => x.basename === "app.js", async (x) => {
            x.relative = appRelPath;
            x.contents = Buffer.from(await nunjucks.renderString(x.contents.toString(), {
                name: `${projectName}Application`
            }));
            return x;
        }).mapIf((x) => x.basename === "package.json", (x) => {
            const packageJson = JSON.parse(x.contents.toString());
            packageJson.name = name;
            packageJson.main = `"./bin/${name}.js"`;
            x.contents = Buffer.from(JSON.stringify(packageJson, null, "  "));
            return x;
        }).mapIf((x) => x.basename === "adone.conf.js", async (x) => {
            x.contents = Buffer.from(await nunjucks.renderString(x.contents.toString(), {
                name,
                from: appRelPath
            }));
            return x;
        }).dest(projectPath, {
            produceFiles: true
        }).through((x) => {
            this._addFileToGit(x.relative);
        });

        // npm
        await this._installNpms(projectPath);

        // git
        if (!skipGit) {
            await this._initializeGit(projectPath);
        }
    }

    _addFileToGit(filePath) {
        this.gitFiles.push(filePath);
        this._logFileCreation(filePath);
    }

    async _createWebApp(name, projectName, projectPath, { sourceDir, skipGit, frontend }) {
        const withFrontend = is.string(frontend);
        const appRelPath = path.join(sourceDir, "app.js");
        const backendPath = withFrontend ? path.join(projectPath, "backend") : projectPath;
        this.gitFiles.push(path.join(withFrontend ? "backend" : "", "package-lock.json"));

        // common
        await fast.src("common/**/*", {
            cwd: this.templatesPath
        }).filter((x) => {
            if (x.basename === ".gitignore" && skipGit) {
                return false;
            }
            return true;
        }).mapIf((x) => x.basename === "package.json", (x) => {
            const packageJson = JSON.parse(x.contents.toString());
            packageJson.name = name;
            packageJson.main = `./bin/${name}.js`;
            x.contents = Buffer.from(JSON.stringify(packageJson, null, "  "));
            return x;
        }).mapIf((x) => x.basename === "adone.conf.js", async (x) => {
            const bin = await nunjucks.renderString(await fs.readFile(path.join(this.adoneConfPath, "bin.nunjucks"), { encoding: "utf8" }), {
                fromBin: appRelPath
            });
            const lib = await nunjucks.renderString(await fs.readFile(path.join(this.adoneConfPath, "lib.nunjucks"), { encoding: "utf8" }), {
                fromBin: appRelPath,
                fromLib: path.join(sourceDir, "**", "*")
            });

            x.contents = Buffer.from(await nunjucks.renderString(x.contents.toString(), {
                bin,
                lib,
                name,
                from: appRelPath
            }));
            return x;
        }).dest(backendPath, {
            produceFiles: true
        }).through((x) => {
            this._addFileToGit(withFrontend ? path.join("backend", x.relative) : x.relative);
        });

        // src
        await fast.src(`skeletons/webapp/${frontend}/**/*`, {
            cwd: this.templatesPath
        }).map((x) => {
            x.relative = path.join(sourceDir, x.relative);
            return x;
        }).mapIf((x) => x.basename === "app.js", async (x) => {
            x.contents = Buffer.from(await nunjucks.renderString(x.contents.toString(), {
                name: `${projectName}Application`
            }));
            return x;
        }).dest(backendPath, {
            produceFiles: true
        }).through((x) => {
            this._addFileToGit(withFrontend ? path.join("backend", x.relative) : x.relative);
        });

        // configs
        await fast.src(`configs/webapp/${frontend}/**/*`, {
            cwd: this.templatesPath
        }).dest(backendPath, {
            produceFiles: true
        }).through((x) => {
            this._addFileToGit(withFrontend ? path.join("backend", x.relative) : x.relative);
        });

        // readme
        await fast.src(`readme/webapp/${frontend}/**/*`, {
            cwd: this.templatesPath
        }).map(async (x) => {
            x.contents = Buffer.from(await nunjucks.renderString(x.contents.toString(), {
                name,
                adoneVersion: adone.package.version
            }));

            return x;
        }).dest(projectPath, {
            produceFiles: true
        }).through((x) => {
            this._addFileToGit(x.relative);
        });

        // npm
        await this._installNpms(backendPath);

        // frontend
        if (withFrontend) {
            await this._installFrontend(name, projectPath, { frontend });
        }

        // git
        if (!skipGit) {
            await this._initializeGit(projectPath);
        }
    }

    _spawnEditor(path, editor) {
        if (!is.nil(editor)) {
            (new adone.util.Editor({ path, editor })).spawn();
        }
    }

    async _installFrontend(name, projectPath, { frontend }) {
        const bar = adone.terminal.progress({
            schema: " :spinner installing frontend"
        });
        bar.update(0);

        try {
            switch (frontend) {
                case "ng":
                    await this._initNgFrontend(name, projectPath);
                    break;
            }

            bar.setSchema(" :spinner frontend installed");
            bar.complete(true);
        } catch (err) {
            bar.setSchema(" :spinner frontend installation failed");
            bar.complete(false);
            throw err;
        }
    }

    async _initNgFrontend(name, projectPath) {
        await exec("ng", ["new", name, "--directory", "frontend"], {
            cwd: projectPath
        });

        const frotnendPath = path.join(projectPath, "frontend");

        // get commited frontend files
        const repository = await git.Repository.open(frotnendPath);
        const commit = await repository.getBranchCommit("master");
        const tree = await commit.getTree();

        await new Promise(((resolve, reject) => {
            const walker = tree.walk();

            walker.on("entry", (entry) => {
                this.gitFiles.push(path.join("frontend", entry.path()));
            });
            walker.on("end", (/*entries*/) => {
                resolve();
            });
            walker.on("error", reject);

            walker.start();
        }));

        // Remove frontend .git
        await fs.rm(path.join(frotnendPath, ".git"));
    }

    async _installNpms(projectPath) {
        const bar = adone.terminal.progress({
            schema: " :spinner installing npm packages"
        });
        bar.update(0);

        try {
            await exec("npm", ["i", "--save-dev"], {
                cwd: projectPath
            });

            bar.setSchema(" :spinner npm packages installed");
            bar.complete(true);
        } catch (err) {
            bar.setSchema(" :spinner npm packages installation failed");
            bar.complete(false);
            throw err;
        }
    }

    async _initializeGit(projectPath) {
        const time = adone.datetime.now() / 1000;
        const zoneOffset = adone.datetime().utcOffset();

        const bar = adone.terminal.progress({
            schema: " :spinner initializing git"
        });
        bar.update(0);

        try {
            const logoContent = await fs.readFile(path.join(adone.appinstance.adoneEtcPath, "media", "adone.txt"), { encoding: "utf8" });
            const repository = await git.Repository.init(projectPath, 0);
            const index = await repository.refreshIndex();
            for (const file of this.gitFiles) {
                await index.addByPath(file); // eslint-disable-line
            }
            await index.write();
            const oid = await index.writeTree();
            const author = git.Signature.create("ADONE", "info@adone.io", time, zoneOffset);
            const committer = git.Signature.create("ADONE", "info@adone.io", time, zoneOffset);
            await repository.createCommit("HEAD", author, committer, `initial commit from adone/cli\n\n${logoContent}`, oid, []);
            bar.setSchema(" :spinner git initialized");
            bar.complete(true);
        } catch (err) {
            bar.setSchema(" :spinner git initialization failed");
            bar.complete(false);
            throw err;
        }
    }

    _logFileCreation(name) {
        terminal.print(` {green-fg}${unicode.approx(unicode.symbol.tick)}{/green-fg} file {bold}${name}{/bold}\n`);
    }

    static new() {
        return new Generator();
    }
}
