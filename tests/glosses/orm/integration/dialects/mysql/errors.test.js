import Support from "../../support";

const dialect = Support.getTestDialect();
const { DataTypes } = adone.orm;

describe("[MYSQL Specific] Errors", { skip: dialect !== "mysql" }, () => {

    const validateError = async (promise, errClass, errValues) => {
        const wanted = Object.assign({}, errValues);

        const err = await assert.throws(async () => {
            await promise;
        }, errClass);
        Object.keys(wanted).forEach((k) => expect(err[k]).to.eql(wanted[k]));
    };

    describe("ForeignKeyConstraintError", () => {
        beforeEach(function () {
            this.Task = this.sequelize.define("task", { title: DataTypes.STRING });
            this.User = this.sequelize.define("user", { username: DataTypes.STRING });
            this.UserTasks = this.sequelize.define("tasksusers", { userId: DataTypes.INTEGER, taskId: DataTypes.INTEGER });

            this.User.belongsToMany(this.Task, { onDelete: "RESTRICT", through: "tasksusers" });
            this.Task.belongsToMany(this.User, { onDelete: "RESTRICT", through: "tasksusers" });

            this.Task.belongsTo(this.User, { foreignKey: "primaryUserId", as: "primaryUsers" });
        });

        it("in context of DELETE restriction", function () {
            const self = this;
            const ForeignKeyConstraintError = this.sequelize.ForeignKeyConstraintError;

            return this.sequelize.sync({ force: true }).bind({}).then(() => {
                return Promise.all([
                    self.User.create({ id: 67, username: "foo" }),
                    self.Task.create({ id: 52, title: "task" })
                ]);
            }).spread(function (user1, task1) {
                this.user1 = user1;
                this.task1 = task1;
                return user1.setTasks([task1]);
            }).then(function () {
                return Promise.all([
                    validateError(this.user1.destroy(), ForeignKeyConstraintError, {
                        fields: ["userId"],
                        table: "users",
                        value: undefined,
                        index: "tasksusers_ibfk_1",
                        reltype: "parent"
                    }),
                    validateError(this.task1.destroy(), ForeignKeyConstraintError, {
                        fields: ["taskId"],
                        table: "tasks",
                        value: undefined,
                        index: "tasksusers_ibfk_2",
                        reltype: "parent"
                    })
                ]);
            });
        });

        it("in context of missing relation", function () {
            const self = this;
            const ForeignKeyConstraintError = this.sequelize.ForeignKeyConstraintError;

            return this.sequelize.sync({ force: true }).then(() =>
                validateError(self.Task.create({ title: "task", primaryUserId: 5 }), ForeignKeyConstraintError, {
                    fields: ["primaryUserId"],
                    table: "users",
                    value: 5,
                    index: "tasks_ibfk_1",
                    reltype: "child"
                }));
        });

    });
});