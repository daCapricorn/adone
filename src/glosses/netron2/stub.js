const {
    is,
    x,
    netron2: { Definition, Definitions, Reflection }
} = adone;

export default class Stub {
    constructor(netron, instance, r) {
        this.netron = netron;
        this.instance = instance;
        this._reflection = r || Reflection.from(instance);
        this._def = null;
    }

    investigator() {
        return this._reflection;
    }

    get definition() {
        if (is.null(this._def)) {
            const r = this._reflection;
            const def = this._def = new Definition();

            def.id = this.netron.uniqueDefId.next();
            def.parentId = 0;
            def.name = r.getName();
            def.description = r.getDescription();
            if (r.hasTwin()) {
                def.twin = r.getTwin();
            }

            const methods = r.getMethods();
            const $ = def.$ = {};
            for (const [method, meta] of methods) {
                const args = [];
                for (const arg of meta.args) {
                    args.push([Reflection.getNameOfType(arg[0]), arg[1]]);
                }
                $[method] = {
                    method: true,
                    type: Reflection.getNameOfType(meta.type),
                    args,
                    description: meta.description
                };
            }
            const properties = r.getProperties();
            for (const [prop, meta] of properties) {
                $[prop] = {
                    type: Reflection.getNameOfType(meta.type),
                    readonly: meta.readonly,
                    description: meta.description
                };
            }
        }
        return this._def;
    }

    set(prop, data, peer) {
        let $ = this.definition.$;
        const target = this.instance;
        if (prop in $) {
            $ = $[prop];
            if ($.method) {
                this._processArgs(peer, data, true);
                return Reflect.apply(target[prop], this.instance, data);
            } else if (!$.readonly) {
                data = this._processArgs(peer, data, false);
                target[prop] = data;
            } else {
                return Promise.reject(new x.InvalidAccess(`${prop} is not writable`));
            }
            return Promise.resolve(true);
        }
        return Promise.reject(new x.NotExists(`${prop} not exists`));
    }

    get(prop, defaultData, peer) {
        let $ = this.definition.$;
        const target = this.instance;
        if (prop in $) {
            $ = $[prop];
            if ($.method) {
                this._processArgs(peer, defaultData, true);
                return new Promise((resolve) => {
                    resolve(target[prop].apply(this.instance, defaultData));
                }).then((result) => {
                    return this._processResult(peer, result);
                });
            }
            let val = target[prop];
            if (is.undefined(val)) {
                defaultData = this._processArgs(peer, defaultData, false);
                val = defaultData;
            } else {
                val = this._processResult(peer, val);
            }
            return Promise.resolve(val);
        }
        return Promise.reject(new x.NotExists(`${prop} not exists`));
    }

    _processResult(peer, result) {
        if (is.netron2Context(result)) {
            result = this.netron.refContext(peer.info, result);
            result.parentId = result.parentId || this._def.id;
            result.uid = peer.info.id.asBase58(); // definition owner
        } else if (is.netron2Definitions(result)) {
            const newDefs = new Definitions();
            for (let i = 0; i < result.length; i++) {
                const obj = result.get(i);
                newDefs.push(this._processResult(peer, obj));
            }
            return newDefs;
        }
        return result;
    }

    _processArgs(peer, args, isMethod) {
        if (isMethod && is.array(args)) {
            for (let i = 0; i < args.length; ++i) {
                args[i] = this._processObject(peer, args[i]);
            }
        } else {
            return this._processObject(peer, args);
        }
    }

    _processObject(peer, obj) {
        if (is.netron2Reference(obj)) {
            const stub = this.netron.getStubById(obj.defId);
            if (is.undefined(stub)) {
                throw new x.Unknown(`Unknown definition id ${obj.defId}`);
            }
            return stub.instance;
        } else if (is.netron2Definition(obj)) {
            peer._updateDefinitions({ weak: obj });
            return this.netron._createInterface(obj, peer.info);
        } else if (is.netron2Definitions(obj)) {
            for (let i = 0; i < obj.length; i++) {
                obj.set(i, this._processObject(peer, obj.get(i)));
            }
        }
        return obj;
    }
}
adone.tag.add(Stub, "NETRON2_STUB");