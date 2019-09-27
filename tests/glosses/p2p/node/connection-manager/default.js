/**
 * eslint-env mocha
 */


const Prepare = require("./utils/prepare");

describe("default", () => {
    const prepare = Prepare(3, { pollInterval: 1000 });
    before(prepare.before);
    after(prepare.after);

    it("does not kick out any peer", (done) => {
        prepare.connManagers().forEach((connManager) => {
            connManager.on("disconnected", () => {
                throw new Error("should not have disconnected");
            });
        });
        setTimeout(done, 1900);
    });
});