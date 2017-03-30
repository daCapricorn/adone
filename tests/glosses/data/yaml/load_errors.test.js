import { TEST_SCHEMA } from "./support/schema";

describe("glosses", "data", "yaml", "load errors", () => {
    const { fs, data: { yaml } } = adone;
    const fixtures = new fs.Directory(__dirname, "error_samples");
    const files = fs.readdirSync(fixtures.path());

    for (const rfile of files) {
        const file = fixtures.getVirtualFile(rfile);
        specify(file.filename().slice(0, -3), async () => {
            const yamlSource = await file.content();

            assert.throws(() => {
                yaml.loadAll(
                    yamlSource,
                    () => { },
                    {
                        filename: file.filename(),
                        schema: TEST_SCHEMA,
                        onWarning(e) {
                            throw e;
                        }
                    }
                );
            }, yaml.Exception, file.filename());
        });
    }
});
