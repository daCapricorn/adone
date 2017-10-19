const {
    fs,
    omnitron: { STATUS },
    std,
    vault,
    x
} = adone;

export default class SystemDB {
    constructor() {
        this.raw = new vault.Vault({
            location: std.path.join(adone.realm.config.omnitron.varPath, "system.db")
        });
    }

    async open() {
        await fs.mkdirp(std.path.dirname(this.raw.options.location));
        await this.raw.open();
    }

    async close() {
        await this.raw.close();
    }

    getValuable(name) {
        if (!this.raw.has(name)) {
            return this.raw.create(name);
        }
        return this.raw.get(name);
    }

    getServicesValuable() {
        return this.getValuable("$services");
    }

    async registerService(name) {
        const servicesMeta = await this.getServicesValuable();
        const services = vault.slice(servicesMeta, "service");

        if (services.has(name)) {
            throw new x.Exists(`Service '${name}' is already registered`);
        }

        return services.set(name, {
            group: adone.text.random(16),
            status: STATUS.DISABLED
        });
    }

    async unregisterService(name) {
        const servicesMeta = await this.getServicesValuable();
        const services = vault.slice(servicesMeta, "service");

        if (!services.has(name)) {
            throw new x.NotExists(`Service '${name}' does not exist`);
        }

        return services.delete(name);
    }
}