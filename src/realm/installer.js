const {
    x,
    is,
    fs,
    std,
    fast,
    text,
    util
} = adone;

const ADONE_CONFIG = adone.config;
const ADONE_CONFIGS_PATH = ADONE_CONFIG.configsPath;
const CLI_SUBSYSTEMS_PATH = ADONE_CONFIG.cli.subsystemsPath;
const OMNITRON_SERVICES_PATH = ADONE_CONFIG.omnitron.servicesPath;

const DEST_OPTIONS = {
    produceFiles: true,
    originTimes: true,
    originMode: true,
    originOwner: true
};

export default class Installer {
    constructor({ name }) {
        this.name = name;
    }

    async install({ symlink = false } = {}) {
        this.bar = adone.runtime.term.progress({
            schema: " :spinner preparing"
        });
        this.bar.update(0);

        let adoneConf;

        try {
            if (std.path.isAbsolute(this.name)) {
                adoneConf = await this.installFromLocal(this.name, { symlink });
            } else {
                if (this.name.startsWith("adone.")) {
                    //
                } else {
                    const fullPath = std.path.join(process.cwd(), this.name);
                    adoneConf = await this.installFromLocal(fullPath, { symlink });
                }
            }
            this.bar.setSchema(` :spinner ${adoneConf.project.type} {green-fg}${adoneConf.name} v${adoneConf.version}{/green-fg} successfully installed`);
            this.bar.complete(true);
        } catch (err) {
            if (!is.null(this.bar)) {
                this.bar.setSchema(" :spinner installation failed");
                this.bar.complete(false);
            }
            throw err;
        }
    }

    async installLocal(path, { symlink }) {
        this.bar.setSchema(` :spinner installing from: ${path}`);

        const adoneConf = await adone.project.Configuration.load({
            cwd: path
        });

        // if (adoneConf.project.type === "composite") {
        //     for (const [key, relativeDir] of Object.entries(adoneConf.project.structure)) {

        //     }
        // }

        switch (adoneConf.project.type) {
            case "adone-cli":
                await this._installAdoneCliSubsystem(adoneConf, path, {
                    symlink
                });
                break;
            case "omnitron-service":
                await this._installOmnitronService(adoneConf, path, {
                    symlink
                });
                break;
        }
        return adoneConf;
    }

    async _installAdoneCliSubsystem(adoneConf, cwd, { symlink } = {}) {
        const destPath = std.path.join(CLI_SUBSYSTEMS_PATH, adoneConf.name);

        // force create dir
        await fs.mkdir(CLI_SUBSYSTEMS_PATH);

        if (symlink) {
            await this._installSymlink(destPath, cwd);
        } else {
            await this._installFiles(adoneConf, destPath, cwd);
        }

        let indexPath;
        if (is.string(adoneConf.project.main)) {
            indexPath = std.path.join(destPath, adoneConf.project.main);
        } else {
            indexPath = destPath;
        }

        const subsystemInfo = {
            name: adoneConf.name,
            description: adoneConf.description,
            subsystem: indexPath
        };
        const subsystems = adone.runtime.app.config.cli.subsystems;

        let i;
        for (i = 0; i < subsystems.length; i++) {
            if (subsystems[i].name === adoneConf.name) {
                break;
            }
        }

        if (i < subsystems.length) {
            subsystems[i] = subsystemInfo;
        } else {
            subsystems.push(subsystemInfo);
        }

        subsystems.sort((a, b) => a.name > b.name);

        await adone.runtime.app.config.save(std.path.join(ADONE_CONFIGS_PATH, "cli.json"), "cli", {
            space: "    "
        });
    }

    async _installOmnitronService(adoneConf, cwd, { symlink } = {}) {
        const destPath = std.path.join(OMNITRON_SERVICES_PATH, adoneConf.name);

        // force create dir
        await fs.mkdir(OMNITRON_SERVICES_PATH);

        if (symlink) {
            await this._installSymlink(destPath, cwd);
        } else {
            await this._installFiles(adoneConf, destPath, cwd);
        }
    }

    async _installSymlink(destPath, cwd) {
        if (await fs.exists(destPath)) {
            const stat = fs.lstatSync(destPath);
            if (!stat.isSymbolicLink()) {
                throw new x.Exists("Extension already installed, please uninstall it and try again");
            }
            await fs.rm(destPath);
        }

        if (is.windows) {
            await fs.symlink(cwd, destPath, "junction");
        } else {
            await fs.symlink(cwd, destPath);
        }
    }

    async _installFiles(adoneConf, destPath, cwd) {
        for (const [name, info] of Object.entries(adoneConf.project.structure)) {
            let srcPath;

            if (is.string(info)) {
                srcPath = info;
            } else if (is.plainObject(info)) {
                srcPath = adoneConf.project.structure[name].$to;
                if (!is.glob(srcPath)) {
                    srcPath = util.globize(srcPath, { recursively: true });
                }
            } else {
                throw new x.NotValid("Invalid type of project part descriptor");
            }

            const subPath = std.path.join(destPath, name);

            if (await fs.exists(subPath)) { // eslint-disable-line
                await fs.rm(subPath); // eslint-disable-line
            }

            // eslint-disable-next-line
            await fast.src(srcPath, {
                cwd
            }).dest(subPath, DEST_OPTIONS);
        }
    }

    _printInfo(adoneConf) {
        adone.log(text.pretty.table(
            [
                {
                    name: "Name:",
                    value: `${adoneConf.name} v${adoneConf.version}`
                },
                {
                    name: "Type:",
                    value: adoneConf.project.type
                },
                {
                    name: "Description:",
                    value: adoneConf.description
                },
                {
                    name: "Author:",
                    value: adoneConf.author
                }
            ],
            {
                noHeader: true,
                borderless: true,
                style: {
                    compact: true
                },
                model: [
                    {
                        id: "name",
                        style: "{green-fg}",
                        align: "right",
                        format: (val) => `${val} `
                    },
                    {
                        id: "value"
                    }
                ]
            }
        ));
    }
}