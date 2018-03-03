const {
    error,
    is,
    std
} = adone;

const TEMPLATE_PATTERN = /XXXXXX/;
const osTmpDir = std.os.tmpdir();
const defaultGenerator = () => `${process.pid}${adone.text.random(12)}`;

export default async ({ tries = 3, template, tmpRootPath = osTmpDir, subDirs, prefix = "tmp-", nameGenerator = defaultGenerator, ext = "" } = {}) => {
    if (is.nan(tries) || tries < 0) {
        throw new error.NotValid("Invalid tries");
    }

    if (is.string(template) && !template.match(TEMPLATE_PATTERN)) {
        throw new error.NotValid("Invalid template provided");
    }

    for (let i = 0; i < tries; i++) {
        if (is.string(subDirs)) {
            return std.path.join(tmpRootPath, subDirs);
        }

        if (is.string(template)) {
            return template.replace(TEMPLATE_PATTERN, adone.text.random(6));
        }

        const path = std.path.join(tmpRootPath, `${prefix}${nameGenerator()}${ext}`);

        try {
            await adone.fs.stat(path); // eslint-disable-line no-await-in-loop
            continue;
        } catch (err) {
            return path;
        }
    }

    throw new error.Exception("Could not get a unique tmp filename, max tries reached");
};