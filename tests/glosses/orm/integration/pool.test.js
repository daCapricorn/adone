describe("pooling", function () {
    const { orm } = adone;
    const dialect = this.getTestDialect();

    if (dialect === "sqlite") {
        return;
    }

    beforeEach(() => {
        this.sinon = adone.shani.util.sandbox.create();
    });

    afterEach(() => {
        this.sinon.restore();
    });

    it("should reject when unable to acquire connection in given time", async () => {
        this.testInstance = orm.create("localhost", "ffd", "dfdf", {
            dialect,
            databaseVersion: "1.2.3",
            pool: {
                acquire: 1000 //milliseconds
            }
        });

        this.sinon.stub(this.testInstance.connectionManager, "_connect").callsFake(() => new Promise(() => { }));

        await assert.throws(async () => {
            await this.testInstance.authenticate();
        }, "ResourceRequest timed out");
    });
});
