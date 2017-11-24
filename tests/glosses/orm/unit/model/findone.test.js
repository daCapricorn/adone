import Support from "../../support";

const current = Support.sequelize;
const {
    DataTypes
} = adone.orm;

describe(Support.getTestDialectTeaser("Model"), () => {
    describe("method findOne", () => {
        before(function () {
            this.oldFindAll = current.Model.findAll;
        });
        after(function () {
            current.Model.findAll = this.oldFindAll;
        });

        beforeEach(function () {
            this.stub = current.Model.findAll = stub().returns(Promise.resolve());
        });

        describe("should not add limit when querying on a primary key", () => {
            it("with id primary key", async function () {
                const Model = current.define("model");

                await Model.findOne({ where: { id: 42 } });
                expect(this.stub.getCall(0).args[0]).to.be.an("object").not.to.have.property("limit");
            });

            it("with custom primary key", async function () {
                const Model = current.define("model", {
                    uid: {
                        type: DataTypes.INTEGER,
                        primaryKey: true,
                        autoIncrement: true
                    }
                });

                await Model.findOne({ where: { uid: 42 } });
                expect(this.stub.getCall(0).args[0]).to.be.an("object").not.to.have.property("limit");
            });

            it("with blob primary key", async function () {
                const Model = current.define("model", {
                    id: {
                        type: DataTypes.BLOB,
                        primaryKey: true,
                        autoIncrement: true
                    }
                });

                await Model.findOne({ where: { id: Buffer.from("foo") } });
                expect(this.stub.getCall(0).args[0]).to.be.an("object").not.to.have.property("limit");
            });
        });

        it("should add limit when using { $ gt on the primary key", async function () {
            const Model = current.define("model");

            await Model.findOne({ where: { id: { $gt: 42 } } });
            expect(this.stub.getCall(0).args[0]).to.be.an("object").to.have.property("limit");
        });
    });
});