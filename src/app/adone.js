#!/usr/bin/env node

import "..";
import Configuration from "../lib/app/configuration";

const {
    is,
    path,
    app
} = adone;

const {
    subsystem
} = app;

const command = (name) => path.join(__dirname, "..", "lib", "commands", name);

@subsystem({
    subsystems: [
        {
            name: "inspect",
            group: "common",
            description: "Inspect namespace/object",
            subsystem: command("inspect")
        },
        {
            name: "realm",
            group: "common",
            description: "Realm management",
            subsystem: command("realm")
        },
        {
            name: "repl",
            group: "common",
            description: "Async REPL",
            subsystem: command("repl")
        },
        {
            name: "run",
            group: "common",
            description: "Run application/script/code",
            subsystem: command("run")
        }
    ]
})
class ADONEApp extends app.Application {
    async onConfigure() {
        !is.windows && this.exitOnSignal("SIGINT");

        this.config = await Configuration.load({
            cwd: path.join(adone.ETC_PATH, "adone")
        });

        this._configureLogger();

        // Expose cli interface for subsystems.
        // this.exposeCliInterface();

        // Add cli kit as a subsystem
        // this.addSubsystem({
        //     name: "kit",
        //     bind: true,
        //     subsystem: adone.cli.kit
        // });

        // Define command groups.
        const groups = this.config.getGroups();
        for (const group of groups) {
            this.helper.defineCommandsGroup(group);
        }

        await this._addInstalledSubsystems();
    }

    async run() {
        // print usage message by default
        console.log(`${this.helper.getHelpMessage()}\n`);
        return 0;
    }

    _configureLogger() {
        const {
            logging: { logger: { format } },
            cli: { chalk }
        } = adone;

        adone.app.runtime.logger.configure({
            level: "verbose",
            format: format.combine(
                format.colorize({
                    config: adone.logging.logger.config.adone
                }),
                format.padLevels(),
                format.printf((info) => {
                    let result = "";
                    if (is.string(info.prefix)) {
                        result += `[${info.prefix}] `;
                    }
                    if (is.string(info.icon)) {
                        result += `${info.icon}  `;
                    }
                    result += `${chalk.underline(info.level)}${info.message}`;
                    return result;
                })
            ),
            transports: [
                new adone.logging.logger.transport.Console()
            ]
        });
    }

    async _addInstalledSubsystems() {
        const commands = this.config.getCommands();
        for (const ss of commands) {
            // eslint-disable-next-line
            await this.helper.defineCommandFromSubsystem({
                ...adone.util.omit(ss, "name"),
                name: [ss.name, ...adone.util.arrify(ss.aliases)],
                lazily: true
            });
        }
    }
}

app.run(ADONEApp, {
    useArgs: true,
    version: adone.package.version
});
