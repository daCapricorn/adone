const {
    application,
    runtime
} = adone;

export default class Gates extends application.Subsystem {
    async configure() {
        await runtime.netron.registerAdapter("ws", adone.netron.ws.Adapter);

        runtime.netron.on("peer online", (peer) => {
            adone.info(`Peer '${peer.getRemoteAddress().full}' (uid: ${peer.uid}) connected`);
        }).on("peer offline", (peer) => {
            adone.info(`Peer '${peer.getRemoteAddress().full}' (uid: ${peer.uid}) disconnected`);
        });

        adone.info("Gates subsystem configured");
    }

    async initialize() {
        this.config = await this.root.db.getConfiguration();
        Object.assign(runtime.netron.options, await this.config.get("netron"));

        // Bind local gate
        await runtime.netron.bind({
            name: "local",
            port: adone.omnitron.port
        });

        // Bind other enabled gates.
        const gates = await this.config.getGates("on");
        for (const gate of gates) {
            await runtime.netron.bind(gate); // eslint-disable-line
        }

        adone.info("Gates subsystem initialized");
    }

    async uninitialize() {
        try {
            await runtime.netron.disconnect();
            await runtime.netron.unbind();

            // // Let netron gracefully complete all disconnects
            // await adone.promise.delay(500);
        } catch (err) {
            adone.error(err);
        }

        adone.info("Gates subsystem uninitialized");
    }

    addGate(gate) {
        return this.config.addGate(gate);
    }

    deleteGate(name) {
        return this.config.deleteGate(name);
    }

    async upGate(name) {
        const gate = await this.config.getGate(name);
        if (runtime.netron.gates.has(name)) {
            throw new adone.x.IllegalState(`Gate with name '${name}' already active`);
        }
        await runtime.netron.bind(gate);
    }

    async downGate(name) {
        if (name === "local") {
            throw new adone.x.NotAllowed("Down local gate is not allow");
        }

        // This call checks if gate is exist.
        const gate = await this.config.getGate(name);
        if (!runtime.netron.gates.has(name)) {
            throw new adone.x.IllegalState(`Gate with name '${name}' is not active`);
        }
        await runtime.netron.unbind(gate.name);
    }

    async getGates({ active = false } = {}) {
        const allGates = await this.config.getGates();

        if (active) {
            const names = runtime.netron.gates.getAll().map((g) => g.name);
            return allGates.filter((g) => names.includes(g.name));
        }
        return allGates;
    }

    offGate(name) {
        return this.config.offGate(name);
    }

    onGate(name) {
        return this.config.onGate(name);
    }
}
