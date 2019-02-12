const {
    is
} = adone;

class TestApp extends adone.app.Application {
    main() {
        const getters = ["name", "parent", "root", "state"];
        let counter = 0;
        for (const getter of getters) {
            try {
                this[getter] = null;
            } catch (err) {
                if (err instanceof adone.error.NotAllowedException) {
                    counter++;
                } else {
                    console.log(err);
                }
            }
        }

        const expected = ["helper"];
        let isOk = true;
        for (const [name, value] of adone.util.entries(this, { followProto: true })) {
            if (is.function(value)) {
                continue;
            }
            if (!expected.includes(name)) {
                isOk = false;
                break;
            }
        }

        console.log(counter === getters.length && isOk);

        return 0;
    }
}

adone.app.run(TestApp, {
    useArgs: true
});
