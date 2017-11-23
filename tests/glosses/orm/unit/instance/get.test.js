import Support from "../../support";

const { DataTypes } = adone.orm;
const current = Support.sequelize;

describe(Support.getTestDialectTeaser("Instance"), () => {
    describe("get", () => {
        beforeEach(function () {
            this.getSpy = spy();
            this.User = current.define("User", {
                name: {
                    type: DataTypes.STRING,
                    get: this.getSpy
                }
            });
        });

        it("invokes getter if raw: false", function () {
            this.User.build().get("name");

            expect(this.getSpy).to.have.been.called;
        });

        it("does not invoke getter if raw: true", function () {
            expect(this.getSpy, { raw: true }).not.to.have.been.called;
        });
    });
});