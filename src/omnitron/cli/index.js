const { is, text: { pretty } } = adone;
const { STATUSES } = adone.omnitron.const;

export default class extends adone.application.Subsystem {
    initialize() {
        this.defineCommand({
            name: ["omnitron", "om", "0"],
            group: "service_cli",
            help: "Omnitron common service",
            options: [
                {
                    name: "--version",
                    help: "show version of omnitron",
                    handler: this.versionOption
                }
            ],
            commands: [
                {
                    name: "ping",
                    help: "ping the omnitron",
                    handler: this.pingCommand
                },
                {
                    name: "uptime",
                    help: "the omnitron's uptime",
                    handler: this.uptimeCommand
                },
                {
                    name: "env",
                    help: "the omnitron's environment",
                    handler: this.environmentCommand
                },
                {
                    name: "envs",
                    help: "the omnitron's environment variables",
                    handler: this.envsCommand
                },
                {
                    name: "shell",
                    help: "run omnitron's shell",
                    handler: this.shellCommand
                },
                {
                    name: "status",
                    help: "show status of service(s)",
                    arguments: [
                        {
                            name: "service",
                            type: String,
                            nargs: "*",
                            default: "",
                            help: "Name of service"
                        }
                    ],
                    handler: this.statusCommand
                },
                {
                    name: "enable",
                    help: "enable service",
                    arguments: [
                        {
                            name: "service",
                            type: String,
                            help: "Name of service"
                        }
                    ],
                    options: [
                        {
                            name: "--deps",
                            help: "Enable dependent services"
                        }
                    ],
                    handler: this.enableCommand
                },
                {
                    name: "disable",
                    help: "disable service",
                    arguments: [
                        {
                            name: "service",
                            type: String,
                            help: "Name of service"
                        }
                    ],
                    handler: this.disableCommand
                },
                {
                    name: "start",
                    help: "start omnitron or service",
                    arguments: [
                        {
                            name: "service",
                            type: String,
                            default: "",
                            help: "Name of service"
                        }
                    ],
                    handler: this.startCommand
                },
                {
                    name: "stop",
                    help: "stop omnitron or service",
                    arguments: [
                        {
                            name: "service",
                            type: String,
                            default: "",
                            help: "Name of service"
                        }
                    ],
                    handler: this.stopCommand
                },
                {
                    name: "restart",
                    help: "restart omnitron or service",
                    arguments: [
                        {
                            name: "service",
                            type: String,
                            default: "",
                            help: "Name of service"
                        }
                    ],
                    handler: this.restartCommand
                },
                {
                    name: "list",
                    help: "show services",
                    options: [
                        {
                            name: "--status",
                            help: "status of services",
                            type: String,
                            choices: STATUSES,
                            default: STATUSES[STATUSES.length - 1]
                        }
                    ],
                    handler: this.listCommand
                },
                {
                    name: "gates",
                    help: "show gates",
                    handler: this.gatesCommand
                },
                {
                    name: "sys",
                    help: "system metrics",
                    commands: [
                        {
                            name: "info",
                            help: "show system information",
                            handler: this.systemInfoCommand
                        },
                        {
                            name: "volumes",
                            help: "show list of volumes",
                            handler: this.systemVolumesCommand
                        },
                        {
                            name: "ps",
                            help: "show list of processes",
                            handler: this.systemPsCommand
                        }
                    ]
                },
                {
                    name: "vault",
                    help: "vault management",
                    commands: [
                        {
                            name: "open",
                            help: "open vault",
                            arguments: [
                                {
                                    name: "name",
                                    type: String,
                                    help: "name of vault"
                                }
                            ],
                            handler: this.vaultOpenCommand
                        },
                        {
                            name: "close",
                            help: "close vault",
                            arguments: [
                                {
                                    name: "name",
                                    type: String,
                                    help: "name of vault"
                                }
                            ],
                            handler: this.vaultCloseCommand
                        },
                        {
                            name: "set",
                            help: "set value of valuable's item",
                            arguments: [
                                {
                                    name: "vault",
                                    type: String,
                                    help: "name of vault"
                                },
                                {
                                    name: "valuable",
                                    type: String,
                                    help: "name of valuable"
                                },
                                {
                                    name: "key",
                                    type: String,
                                    help: "key of item"
                                },
                                {
                                    name: "value",
                                    type: String,
                                    help: "value of item"
                                }
                            ],
                            handler: this.vaultSetCommand
                        },
                        {
                            name: "get",
                            help: "get value of valuable's item",
                            arguments: [
                                {
                                    name: "vault",
                                    type: String,
                                    help: "name of vault"
                                },
                                {
                                    name: "valuable",
                                    type: String,
                                    help: "name of valuable"
                                },
                                {
                                    name: "key",
                                    type: String,
                                    help: "key of item"
                                }
                            ],
                            handler: this.vaultGetCommand
                        },
                        {
                            name: "type",
                            help: "get type of valuable's item",
                            arguments: [
                                {
                                    name: "vault",
                                    type: String,
                                    help: "name of vault"
                                },
                                {
                                    name: "valuable",
                                    type: String,
                                    help: "name of valuable"
                                },
                                {
                                    name: "key",
                                    type: String,
                                    help: "key of item"
                                }
                            ],
                            handler: this.vaultTypeCommand
                        },
                        {
                            name: "del",
                            help: "delete valuable or valuable's item",
                            arguments: [
                                {
                                    name: "vault",
                                    type: String,
                                    help: "name of vault"
                                },
                                {
                                    name: "valuable",
                                    type: String,
                                    help: "name of valuable"
                                },
                                {
                                    name: "key",
                                    type: String,
                                    default: "",
                                    help: "key of item"
                                }
                            ],
                            handler: this.vaultDeleteCommand
                        },
                        {
                            name: "keys",
                            help: "show valuable keys",
                            arguments: [
                                {
                                    name: "vault",
                                    type: String,
                                    help: "name of vault"
                                },
                                {
                                    name: "valuable",
                                    type: String,
                                    help: "name of valuable"
                                }
                            ],
                            handler: this.vaultKeysCommand
                        },
                        {
                            name: "tags",
                            help: "show valuable tags",
                            arguments: [
                                {
                                    name: "vault",
                                    type: String,
                                    help: "name of vault"
                                },
                                {
                                    name: "valuable",
                                    type: String,
                                    help: "name of valuable"
                                }
                            ],
                            handler: this.vaultTagsCommand
                        },
                        {
                            name: "clear",
                            help: "clear valuable",
                            arguments: [
                                {
                                    name: "vault",
                                    type: String,
                                    help: "name of vault"
                                },
                                {
                                    name: "valuable",
                                    type: String,
                                    help: "name of valuable"
                                }
                            ],
                            handler: this.vaultClearCommand
                        }
                    ]
                }
            ]
        });
    }

    uninitialize() {
        return this.dispatcher.disconnect();
    }

    get dispatcher() {
        if (is.undefined(this._dispatcher)) {
            this._dispatcher = new adone.omnitron.Dispatcher(this.app);
        }
        return this._dispatcher;
    }

    async versionOption() {
        adone.log(await this.dispatcher.getVersion());
        return 0;
    }

    async pingCommand() {
        adone.log(await this.dispatcher.ping());
        return 0;
    }

    async uptimeCommand() {
        adone.log(await this.dispatcher.uptime());
        return 0;
    }

    async environmentCommand() {
        adone.log(await this.dispatcher.environment());
        return 0;
    }

    async envsCommand() {
        adone.log(adone.text.pretty.json(await this.dispatcher.envs()));
        return 0;
    }

    async shellCommand() {

    }

    async statusCommand(args) {
        try {
            adone.log(pretty.table(await this.dispatcher.status(args.get("service")), {
                noHeader: true,
                style: {
                    compact: true
                },
                model: [
                    {
                        id: "name",
                        header: "Name",
                        style: "{green-fg}"
                    },
                    {
                        id: "status",
                        header: "Status",
                        style: (val) => {
                            switch (val) {
                                case "disabled": return "{red-bg}{white-fg}";
                                case "enabled": return "{yellow-bg}{black-fg}";
                                case "active": return "{green-bg}{black-fg}";
                                default: return "";
                            }
                        },
                        format: " %s ",
                        align: "right"
                    }
                ]
            }));
        } catch (err) {
            adone.log(err.message);
        }
        return 0;
    }

    async enableCommand(args, opts) {
        try {
            await this.dispatcher.enable(args.get("service"), { enableDeps: opts.has("deps") });
            adone.log(adone.ok);
        } catch (err) {
            adone.log(err.message);
        }
        return 0;
    }

    async disableCommand(args) {
        try {
            await this.dispatcher.disable(args.get("service"));
            adone.log(adone.ok);
        } catch (err) {
            adone.log(err.message);
        }
        return 0;
    }

    async startCommand(args) {
        const serviceName = args.get("service");
        try {
            await this.dispatcher.start(serviceName);
            (serviceName !== "") && adone.log(adone.ok);
        } catch (err) {
            adone.log(err.message);
        }
        return 0;
    }

    async stopCommand(args) {
        const serviceName = args.get("service");
        try {
            await this.dispatcher.stop(serviceName);
            (serviceName !== "") && adone.log(adone.ok);
        } catch (err) {
            adone.error(err.message);
        }
        return 0;
    }

    async restartCommand(args) {
        const serviceName = args.get("service");
        try {
            await this.dispatcher.restart(serviceName);
            (serviceName !== "") && adone.log(adone.ok);
        } catch (err) {
            adone.log(err.message);
        }
        return 0;
    }

    async listCommand(args, opts) {
        const status = opts.get("status");
        try {
            adone.log(pretty.table(await this.dispatcher.list(status), {
                style: {
                    head: ["gray"],
                    compact: true
                },
                model: [
                    {
                        id: "name",
                        header: "Name",
                        style: "{green-fg}"
                    },
                    {
                        id: "contexts",
                        header: "Contexts",
                        format: (contexts) => {
                            return contexts.map((c) => {
                                if (c.default === true) {
                                    return `{bold}{white-fg}${c.id}{/}`;
                                }
                                return `${c.id}`;
                            }).join(", ");
                        }
                    },
                    {
                        id: "description",
                        header: "Description"
                    },
                    {
                        id: "status",
                        header: "Status",
                        style: (val) => {
                            switch (val) {
                                case "disabled": return "{red-bg}{white-fg}";
                                case "enabled": return "{yellow-bg}{black-fg}";
                                case "active": return "{green-bg}{black-fg}";
                                default: return "";
                            }
                        },
                        format: " %s ",
                        align: "right"
                    },
                    {
                        id: "path",
                        header: "Path"
                    }
                ]
            }));
        } catch (err) {
            adone.error(err.message);
        }
        return 0;
    }

    async gatesCommand() {
        try {
            adone.log(pretty.table(await this.dispatcher.gates(), {
                style: {
                    head: ["gray"],
                    compact: true
                },
                model: [
                    {
                        id: "id",
                        header: "ID",
                        style: "{green-fg}"
                    },
                    {
                        id: "port",
                        header: "Address",
                        style: "{bold}"
                    },
                    {
                        id: "type",
                        header: "Type"
                    },
                    {
                        id: "status",
                        header: "Status",
                        style: (val) => {
                            switch (val) {
                                case "disabled": return "{red-bg}{white-bg}";
                                case "enabled": return "{yellow-bg}{black-fg}";
                                case "active": return "{green-bg}{black-fg}";
                                default: return "";
                            }
                        },
                        format: " %s ",
                        align: "right"
                    }
                ]
            }));
        } catch (err) {
            adone.log(err.message);
        }
        return 0;
    }

    async systemInfoCommand() {
        const system = await this.dispatcher.system();
        adone.log((await system.info()).full);
        return 0;
    }

    async systemVolumesCommand(args, opts) {
        const system = await this.dispatcher.system();
        adone.log(pretty.table(await system.volumes(), {
            style: {
                head: ["gray"],
                compact: true
            },
            model: [
                {
                    id: "mount",
                    header: "Mount",
                    style: "{green-fg}"
                },
                {
                    id: "fsType",
                    header: "Type"
                },
                {
                    id: "freeSpace",
                    header: "Free space",
                    format: (space) => adone.util.humanizeSize(space)
                },
                {
                    id: "totalSpace",
                    header: "Total space",
                    format: (space) => adone.util.humanizeSize(space)
                }
            ]
        }));

        return 0;
    }

    async systemPsCommand() {
        const system = await this.dispatcher.system();
        adone.log(pretty.table(await system.processes(), {
            style: {
                head: ["gray"],
                compact: true
            },
            model: [
                {
                    id: "name",
                    header: "Name",
                    style: "{green-fg}"
                },
                {
                    id: "pid",
                    header: "PID"
                },
                {
                    id: "ppid",
                    header: "PPID"
                },
                {
                    id: "state",
                    header: "State",
                    format: (state) => adone.metrics.Process.humanState(state)
                },
                {
                    id: "vsize",
                    header: "VSIZE",
                    format: (vsize) => adone.util.humanizeSize(vsize)
                },
                {
                    id: "rss",
                    header: "RSS",
                    format: (rss) => adone.util.humanizeSize(rss)
                },
                {
                    id: "upTime",
                    header: "Uptime",
                    format: (uptime) => adone.util.humanizeTime(uptime)
                }
            ]
        }));

        return 0;
    }

    async vaultOpenCommand(args, opts) {
        try {
            await this.dispatcher.openVault(args.get("name"));
            adone.log(adone.ok);
        } catch (err) {
            adone.error(err.message);
            return 1;
        }
        return 0;
    }

    async vaultCloseCommand(args, opts) {
        try {
            await this.dispatcher.closeVault(args.get("name"));
            adone.log(adone.ok);
        } catch (err) {
            adone.error(err.message);
            return 1;
        }
        return 0;
    }

    async vaultSetCommand(args, opts) {
        try {
            const iVault = await this.dispatcher.getVault(args.get("vault"));
            const iValuable = await iVault.get(args.get("valuable"));
            await iValuable.set(args.get("key"), args.get("value"));
            adone.log(adone.ok);
        } catch (err) {
            adone.error(err.message);
            return 1;
        }
        return 0;
    }

    async vaultGetCommand(args, opts) {
        try {
            const iVault = await this.dispatcher.getVault(args.get("vault"));
            const iValuable = await iVault.get(args.get("valuable"));
            adone.log(await iValuable.get(args.get("key")));
        } catch (err) {
            adone.error(err.message);
            return 1;
        }
        return 0;
    }

    async vaultTypeCommand(args, opts) {
        try {
            const iVault = await this.dispatcher.getVault(args.get("vault"));
            const iValuable = await iVault.get(args.get("valuable"));
            adone.log(await iValuable.type(args.get("key")));
        } catch (err) {
            adone.error(err.message);
            return 1;
        }
        return 0;
    }

    async vaultDeleteCommand(args, opts) {
        try {
            const iVault = await this.dispatcher.getVault(args.get("vault"));
            const key = args.get("key");
            const valuable = args.get("valuable");
            if (key === "") {
                await iVault.delete(valuable);
            } else {
                const iValuable = await iVault.get(valuable);
                await iValuable.delete(key);
            }
            adone.log(adone.ok);
        } catch (err) {
            adone.error(err.message);
            return 1;
        }
        return 0;
    }

    async vaultKeysCommand(args, opts) {
        try {
            const iVault = await this.dispatcher.getVault(args.get("vault"));
            const iValuable = await iVault.get(args.get("valuable"));
            adone.log(adone.text.pretty.json(await iValuable.keys()));
        } catch (err) {
            adone.error(err.message);
            return 1;
        }
        return 0;
    }

    async vaultTagsCommand(args, opts) {
        try {
            const iVault = await this.dispatcher.getVault(args.get("vault"));
            const iValuable = await iVault.get(args.get("valuable"));
            adone.log(adone.text.pretty.json(await iValuable.tags()));
        } catch (err) {
            adone.error(err.message);
            return 1;
        }
        return 0;
    }


    async vaultClearCommand(args, opts) {
        try {
            const iVault = await this.dispatcher.getVault(args.get("vault"));
            const iValuable = await iVault.get(args.get("valuable"));
            await iValuable.clear();
            adone.log(adone.ok);
        } catch (err) {
            adone.error(err.message);
            return 1;
        }
        return 0;
    }
}
