import Support from "../../support";

const { vendor: { lodash: _ } } = adone;
const { orm } = adone;
const { type } = orm;

describe(Support.getTestDialectTeaser("Model"), () => {
    describe("scope", () => {
        describe("update", () => {
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
                await this.ScopeMe.update({ username: "ruben" }, { where: {} });
                const users = await this.ScopeMe.unscoped().findAll({ where: { username: "ruben" } });
                expect(users).to.have.length(2);
                expect(users[0].get("email")).to.equal("tobi@fakeemail.com");
                expect(users[1].get("email")).to.equal("dan@sequelizejs.com");
            });

            it("should be able to override default scope", async function () {
                await this.ScopeMe.update({ username: "ruben" }, { where: { access_level: { lt: 5 } } });
                const users = await this.ScopeMe.unscoped().findAll({ where: { username: "ruben" } });
                expect(users).to.have.length(2);
                expect(users[0].get("email")).to.equal("tony@sequelizejs.com");
                expect(users[1].get("email")).to.equal("fred@foobar.com");
            });

            it("should be able to unscope destroy", async function () {
                await this.ScopeMe.unscoped().update({ username: "ruben" }, { where: {} });
                const rubens = await this.ScopeMe.unscoped().findAll();
                expect(_.every(rubens, (r) => {
                    return r.get("username") === "ruben";
                })).to.be.true;
            });

            it("should be able to apply other scopes", async function () {
                await this.ScopeMe.scope("lowAccess").update({ username: "ruben" }, { where: {} });
                const users = await this.ScopeMe.unscoped().findAll({ where: { username: { $ne: "ruben" } } });
                expect(users).to.have.length(1);
                expect(users[0].get("email")).to.equal("tobi@fakeemail.com");
            });

            it("should be able to merge scopes with where", async function () {
                await this.ScopeMe.scope("lowAccess").update({ username: "ruben" }, { where: { username: "dan" } });
                const users = await this.ScopeMe.unscoped().findAll({ where: { username: "ruben" } });
                expect(users).to.have.length(1);
                expect(users[0].get("email")).to.equal("dan@sequelizejs.com");
            });
        });
    });
});
