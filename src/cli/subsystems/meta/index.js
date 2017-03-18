const { is, std, fs, util } = adone;

export default class extends adone.application.Subsystem {
    initialize() {
        this.defineCommand({
            name: "meta",
            help: "cli interface for adone meta-management",
            handler: this.metaCommand,
            arguments: [
                {
                    name: "ns",
                    holder: "namespace",
                    type: String,
                    default: "",
                    help: "Name of namespace"
                }
            ],
            options: [
                {
                    name: "--descr",
                    help: "Show description"
                },
                {
                    name: "--paths",
                    help: "Show paths"
                },
                {
                    name: "--full-paths",
                    help: "Show expanded paths"
                }
            ],
            commands: [
                {
                    name: "inspect",
                    help: "Inspect adone namespace/object",
                    arguments: [
                        {
                            name: "name",
                            type: String,
                            default: "",
                            help: "Name of class/object/function/namespace"
                        }
                    ],
                    handler: this.inspectCommand
                },
                {
                    name: "search",
                    help: "Deep search something in the namespace",
                    arguments: [
                        {
                            name: "keyword",
                            type: String,
                            help: "Keyword for searching"
                        }
                    ],
                    options: [
                        {
                            name: "--namespace",
                            type: String,
                            default: "",
                            help: "Name of namespace from which the keyword will be searched"
                        },
                        {
                            name: "--threshold",
                            type: Number,
                            default: 0.1,
                            help: "The accuracy of the search algorithm"
                        }
                    ],
                    handler: this.searchCommand
                },
                {
                    name: "extract",
                    help: "Extract object/function/class with all dependencies",
                    arguments: [
                        {
                            name: "name",
                            type: String,
                            help: "Fully qualified object name (e.g. 'adone.netron.ws.Netron')"
                        }
                    ],
                    options: [
                        {
                            name: "--src",
                            help: "Use 'src' directory"
                        },
                        {
                            name: "--out",
                            type: String,
                            default: "",
                            help: "Path where resulting code will be placed"
                        }
                    ],
                    handler: this.extractCommand
                },
                {
                    name: "slice",
                    help: "Make a slice of adone",
                    arguments: [
                        {
                            name: "ns",
                            help: "Name of namespace"
                        }
                    ],
                    options: [

                    ],
                    handler: this.sliceCommand
                }
            ]
        });
    }

    async metaCommand(args, opts) {
        try {
            const nsName = args.get("ns");
            const namespaces = adone.meta.listNamespaces(nsName);
            if (namespaces.length === 0) {
                throw new adone.x.Unknown(`Unknown namespace: ${nsName}`);
            }
            const showDescr = opts.get("descr");
            const showPaths = opts.get("paths");
            const showFullPaths = opts.get("fullPaths");
            const nameWidth = adone.vendor.lodash.maxBy(namespaces, (o) => o.name.length).name.length;
            let descrWidth = 0;
            let pathsWidth = 0;
            const options = {
                colWidths: [nameWidth]
            };

            if (showDescr) {
                descrWidth = adone.vendor.lodash.maxBy(namespaces, (o) => o.description.length).description.length;
                options.colWidths.push(2, descrWidth);
            }
            if (showPaths || showFullPaths) {
                if (showFullPaths) {
                    for (let i = 0; i < namespaces.length; i++) {
                        namespaces[i].paths = await adone.meta.getNamespacePaths(namespaces[i].name);
                    }
                }
                pathsWidth = adone.terminal.cols - (nameWidth + descrWidth + 2 + (descrWidth > 0 ? 2 : 0));
                options.colWidths.push(2, pathsWidth);
            }

            const table = new adone.text.table.BorderlessTable(options);
            for (const { name, description, paths } of namespaces) {
                const ns = [name];
                if (showDescr) {
                    ns.push(null, description);
                }
                if (showPaths || showFullPaths) {
                    ns.push(null, adone.text.wordwrap(paths.join("; "), pathsWidth));
                }

                table.push(ns);
            }
            adone.log(table.toString());
            // table = new BorderlessTable();
            // const parts = this._parsePath(args.get("ns"));
            // const key = parts.join(".");
            // let obj;
            // if (key === "") {
            //     obj = adone;
            // } else {
            //     obj = adone.vendor.lodash.get(adone, key, undefined);
            // }

            // const type = util.typeOf(obj);
            // switch (type) {
            //     case "function": adone.log(obj.toString()); break;
            //     default: adone.log(adone.meta.inspect(obj, { style: "color", depth: 1, funcDetails: true }));
            // }
        } catch (err) {
            adone.log(err.message);
            return 1;
        }

        return 0;
    }

    async inspectCommand(args, opts) {
        try {
            const name = args.get("name");
            const { namespace, objectName } = adone.meta.parseName(name);
            const inspectOptions = { style: "color", depth: 1, noDescriptor: true, noNotices: true, sort: true };

            let ns;
            if (namespace === "global" || namespace === "") {
                ns = global;
            } else {
                if (namespace === "adone") {
                    ns = adone;
                } else {
                    ns = adone.vendor.lodash.get(adone, namespace.substring("adone".length + 1));
                }
            }

            if (objectName === "") {
                adone.log(adone.meta.inspect(ns, inspectOptions));
            } else if (adone.vendor.lodash.has(ns, objectName)) {
                adone.log(adone.meta.inspect(adone.vendor.lodash.get(ns, objectName), inspectOptions));
            } else {
                throw new adone.x.Unknown(`Unknown object: ${name}`);
            }
        } catch (err) {
            adone.error(err.message);
            return 1;
        }
        return 0;
    }

    async searchCommand(args, opts) {
        try {
            const namespace = opts.get("namespace");
            const name = args.get("keyword");
            const result = await adone.meta.search(name, namespace, { threshold: opts.get("threshold") });

            for (const objName of result) {
                adone.log(objName, adone.meta.inspect(adone.meta.getValue(objName), { depth: 1, style: "color", noDescriptor: true, noNotices: true }));
            }
        } catch (err) {
            adone.error(err.message);
            return 1;
        }
        return 0;
    }

    async extractCommand(args, opts) {
        try {
            const name = args.get("name");
            const { namespace, objectName } = adone.meta.parseName(name);
            if (!namespace.startsWith("adone")) {
                throw new adone.x.NotSupported("Extraction from namespace other than 'adone' not supported");
            }
            if (objectName === "") {
                throw new adone.x.NotValid("Extraction of namespace is not supported");
            }

            const dir = opts.get("src") ? "src" : "lib";
            const pathPrefix =  std.path.join(adone.appinstance.adoneRootPath, dir);
            const sources = (await adone.meta.getNamespacePaths(name)).map((p) => adone.std.path.join(pathPrefix, p));

            for (const srcPath of sources) {
                adone.log(srcPath);
                // const srcFile = await adone.meta.loadSourceFile(srcPath);
                // const mod = adone.vendor.lodash.omit(adone.require(srcPath), ["__esModule"]);
                // for (const [key, val] of Object.entries(mod)) {
                //     let name;
                //     let isDefault;
                //     if (key === "default") {
                //         name = val.name;
                //         isDefault = true;
                //     } else {
                //         name = key;
                //         isDefault = false;
                //     }
                //     const type = util.typeOf(val);
                //     const exportEntry = {
                //         name,
                //         namespace,
                //         type
                //     };
                //     if (isDefault === true) {
                //         exportEntry.default = isDefault;
                //     }
                //     moduleInfo.exports.push(exportEntry);
                // }

                // adone.log();
                // const inspector = new adone.meta.Inspector(srcPath);
                // await inspector.load();
                // inspector.analyze();
                // adone.log(adone.text.pretty.json(inspector.namespaces));
                // adone.log();
                // adone.log(adone.text.pretty.json(inspector.globals));
                // adone.log();
            }
            // const paths = [fullPath];
            // const result = [];
            // for (const path of paths) {
            //     const moduleInfo = {
            //         exports: []
            //     };
            //     moduleInfo.path = path;
            //     const mod = _.omit(adone.require(path), ["__esModule"]);
            //     const subPath = path.substring(pathPrefix.length + pathSuffix.length + 2);
            //     let nsSuffix = adone.std.path.dirname(subPath).replace(".", "");
            //     if (is.string(nsSuffix) && nsSuffix.length > 0) {
            //         nsSuffix = `.${nsSuffix.split("/\\").join(".")}`;
            //     } else {
            //         nsSuffix = "";
            //     }
            //     const namespace = `adone.${subNs}${nsSuffix}`;
            //     const inspector = new adone.meta.Inspector(path);
            //     await inspector.load();
            //     inspector.analyze();
            //     adone.log(adone.text.pretty.json(inspector.namespaces));
            //     adone.log();
            //     adone.log(adone.text.pretty.json(inspector.globals));
            //     adone.log();
            //     // result.push(moduleInfo);
            // }

            // // adone.log(adone.text.pretty.json(result));

            // const outPath = opts.get("out");
        } catch (err) {
            adone.error(err.message);
            return 1;
        }

        return 0;
    }

    _parsePath(ns) {
        const parts = ns.split(".");
        if (parts.length > 0 && (parts[0] === "adone" || parts[0] === "")) {
            parts.shift();
        }
        let obj = adone;
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (!is.propertyOwned(obj, part)) {
                throw new adone.x.NotValid(`Not valid path: adone.${parts.slice(0, i + 1).join(".")}`);
            }
            obj = obj[part];
        }
        return parts;
    }
}
