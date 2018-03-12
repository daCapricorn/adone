
describe("error", () => {
    const { orm, lodash: _ } = adone;
    const { type } = orm;

    const constraintName = "overlap_period";
    beforeEach(function () {
        const self = this;
        this.Booking = self.sequelize.define("Booking", {
            roomNo: type.INTEGER,
            period: new type.RANGE(type.DATE)
        });
        return self.Booking
            .sync({ force: true })
            .then(() => {
                return self.sequelize.query(`ALTER TABLE "${self.Booking.tableName}" ADD CONSTRAINT ${constraintName} EXCLUDE USING gist ("roomNo" WITH =, period WITH &&)`);
            });
    });

    describe("ExclusionConstraintError", () => {

        it("should contain error specific properties", () => {
            const errDetails = {
                message: "Exclusion constraint error",
                constraint: "constraint_name",
                fields: { field1: 1, field2: [123, 321] },
                table: "table_name",
                parent: new Error("Test error")
            };
            const err = new orm.error.ExclusionConstraintError(errDetails);

            _.each(errDetails, (value, key) => {
                expect(value).to.be.deep.equal(err[key]);
            });
        });

        it('should throw ExclusionConstraintError when "period" value overlaps existing', async function () {
            const Booking = this.Booking;



            await Booking.create({
                roomNo: 1,
                guestName: "Incognito Visitor",
                period: [new Date(2015, 0, 1), new Date(2015, 0, 3)]
            });

            await assert.throws(async () => {
                await Booking.create({
                    roomNo: 1,
                    guestName: "Frequent Visitor",
                    period: [new Date(2015, 0, 2), new Date(2015, 0, 5)]
                });
            }, orm.error.ExclusionConstraintError);
        });
    });
});
