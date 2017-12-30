describe("destroy", () => {
    const { orm } = adone;
    const { type } = orm;

    beforeEach(function () {
        this.ScopeMe = this.sequelize.define("ScopeMe", {
            username: type.STRING,
            email: type.STRING,
            access_level: type.INTEGER,
            other_value: type.INTEGER
        }, {
            defaultScope: {
                where: {
                    access_level: {
                        gte: 5
                    }
                }
            },
            scopes: {
                lowAccess: {
                    where: {
                        access_level: {
                            lte: 5
                        }
                    }
                }
            }
        });

        return this.sequelize.sync({ force: true }).then(() => {
            const records = [
                { username: "tony", email: "tony@sequelizejs.com", access_level: 3, other_value: 7 },
                { username: "tobi", email: "tobi@fakeemail.com", access_level: 10, other_value: 11 },
                { username: "dan", email: "dan@sequelizejs.com", access_level: 5, other_value: 10 },
                { username: "fred", email: "fred@foobar.com", access_level: 3, other_value: 7 }
            ];
            return this.ScopeMe.bulkCreate(records);
        });
    });

    it("should apply defaultScope", async function () {
        await this.ScopeMe.destroy({ where: {} });
        const users = await this.ScopeMe.unscoped().findAll();
        expect(users).to.have.length(2);
        expect(users[0].get("username")).to.equal("tony");
        expect(users[1].get("username")).to.equal("fred");
    });

    it("should be able to override default scope", async function () {
        await this.ScopeMe.destroy({ where: { access_level: { lt: 5 } } });
        const users = await this.ScopeMe.unscoped().findAll();
        expect(users).to.have.length(2);
        expect(users[0].get("username")).to.equal("tobi");
        expect(users[1].get("username")).to.equal("dan");
    });

    it("should be able to unscope destroy", async function () {
        await this.ScopeMe.unscoped().destroy({ where: {} });
        expect(await this.ScopeMe.unscoped().findAll()).to.have.length(0);
    });

    it("should be able to apply other scopes", async function () {
        await this.ScopeMe.scope("lowAccess").destroy({ where: {} });
        const users = await this.ScopeMe.unscoped().findAll();
        expect(users).to.have.length(1);
        expect(users[0].get("username")).to.equal("tobi");
    });

    it("should be able to merge scopes with where", async function () {
        await this.ScopeMe.scope("lowAccess").destroy({ where: { username: "dan" } });
        const users = await this.ScopeMe.unscoped().findAll();
        expect(users).to.have.length(3);
        expect(users[0].get("username")).to.equal("tony");
        expect(users[1].get("username")).to.equal("tobi");
        expect(users[2].get("username")).to.equal("fred");
    });
});
