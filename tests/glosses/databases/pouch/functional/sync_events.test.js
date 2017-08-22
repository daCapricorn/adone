import * as util from "./utils";

describe("database", "pouch", "suite2 sync_events", () => {
    const dbName = "testdb";
    const dbRemote = "test_repl_remote";
    let DB = null;

    beforeEach(async () => {
        DB = await util.setup();
        await util.cleanup(dbName, dbRemote);
    });

    after(async () => {
        await util.destroy();
    });

    it("#4251 Should fire paused and active on sync", (done) => {

        const db = new DB(dbName);
        const remote = new DB(dbRemote);

        db.bulkDocs([{ _id: "a" }, { _id: "b" }]).then(() => {

            const repl = db.sync(remote, { retry: true, live: true });
            let counter = 0;

            repl.on("complete", () => {
                done();
            });

            repl.on("active", () => {
                counter++;
                if (counter === 1) {
                    // We are good, initial replication
                } else if (counter === 3) {
                    remote.bulkDocs([{ _id: "e" }, { _id: "f" }]);
                }
            });

            repl.on("paused", () => {
                counter++;
                if (counter === 1) {
                    // Maybe a bug, if we have data should probably
                    // call active first
                    counter--;
                } if (counter === 2) {
                    db.bulkDocs([{ _id: "c" }, { _id: "d" }]);
                } else if (counter === 4) {
                    repl.cancel();
                }
            });
        });
    });
});
