describe("timezone", function () {
    const dialect = this.getTestDialect();

    if (dialect === "sqlite") {
        return; // Sqlite does not support setting timezone
    }

    beforeEach(function () {
        this.sequelizeWithTimezone = this.createSequelizeInstance({
            timezone: "+07:00"
        });
        this.sequelizeWithNamedTimezone = this.createSequelizeInstance({
            timezone: "America/New_York"
        });
    });

    it("returns the same value for current timestamp", async function () {
        let now = "now()";
        const startQueryTime = Date.now();

        if (dialect === "mssql") {
            now = "GETDATE()";
        }

        const query = `SELECT ${now} as now`;
        const [now1, now2] = await Promise.all([
            this.sequelize.query(query, { type: this.sequelize.queryType.SELECT }),
            this.sequelizeWithTimezone.query(query, { type: this.sequelize.queryType.SELECT })
        ]);
        const elapsedQueryTime = Date.now() - startQueryTime + 1001;
        expect(now1[0].now.getTime()).to.be.closeTo(now2[0].now.getTime(), elapsedQueryTime);
    });

    if (dialect === "mysql") {
        it("handles existing timestamps", async function () {
            const NormalUser = this.sequelize.define("user", {});
            const TimezonedUser = this.sequelizeWithTimezone.define("user", {});

            await this.sequelize.sync({ force: true });
            const normalUser = await NormalUser.create({});
            const timezonedUser = await TimezonedUser.findById(normalUser.id);
            // Expect 7 hours difference, in milliseconds.
            // This difference is expected since two instances, configured for each their timezone is trying to read the same timestamp
            // this test does not apply to PG, since it stores the timezone along with the timestamp.
            expect(normalUser.createdAt.getTime() - timezonedUser.createdAt.getTime()).to.be.closeTo(60 * 60 * 7 * 1000, 1000);
        });

        it("handles named timezones", async function () {
            const NormalUser = this.sequelize.define("user", {});
            const TimezonedUser = this.sequelizeWithNamedTimezone.define("user", {});

            await this.sequelize.sync({ force: true });
            const _timezonedUser = await TimezonedUser.create({});
            const [normalUser, timezonedUser] = await Promise.all([
                NormalUser.findById(_timezonedUser.id),
                TimezonedUser.findById(_timezonedUser.id)
            ]);
            // Expect 5 hours difference, in milliseconds, +/- 1 hour for DST
            expect(normalUser.createdAt.getTime() - timezonedUser.createdAt.getTime()).to.be.closeTo(60 * 60 * 4 * 1000 * -1, 60 * 60 * 1000);
        });
    }
});
