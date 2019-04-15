const {
    fs,
    is,
    util: { arrify },
    std: { path }
} = adone;

const DEFAULTS = {
    encoding: "utf-8",
    disableGlobs: false,
    allowEmptyPaths: false,
    isRegex: false,
    verbose: false,
    dry: false,
    glob: {}
};

const validateOptions = async (options) => {
    if (typeof options !== "object" || is.null(options)) {
        throw new Error("Must specify configuration object");
    }

    options.glob = options.glob || {};

    const { files, from, to, ignore, encoding, glob } = options;

    if (is.undefined(files)) {
        throw new Error("Must specify file or files");
    }
    if (is.undefined(from)) {
        throw new Error("Must specify string or regex to replace");
    }
    if (is.undefined(to)) {
        throw new Error("Must specify a replacement (can be blank string)");
    }
    if (typeof glob !== "object") {
        throw new Error("Invalid glob config");
    }

    options.cwd = options.cwd || process.cwd();

    options.files = arrify(files);
    options.ignore = arrify(ignore);

    if (!is.string(encoding) || encoding === "") {
        options.encoding = "utf-8";
    }

    if (is.string(options.backupPath) && !(await fs.exists(options.backupPath))) {
        await fs.mkdirp(options.backupPath);
    }

    return {
        ...DEFAULTS,
        ...options
    };
};

export default async (options) => {
    options = await validateOptions(options);
    const {
        cwd, files, to, encoding, ignore, allowEmptyPaths, disableGlobs, dry, glob
    } = options;

    const paths = await ((disableGlobs)
        ? files
        : Promise.all(files.map(async (pattern) => {
            const files = await fs.glob(pattern, {
                ignore,
                ...glob,
                cwd,
                nodir: true
            });

            if (!allowEmptyPaths && files.length === 0) {
                throw new Error(`No files match the pattern: ${pattern}`);
            }
            return files;

        })).then((paths) => [].concat.apply([], paths)));

    const shouldBackup = is.string(options.backupPath);
    const results = await Promise.all(paths.map(async (file) => {
        const filePath = path.resolve(cwd, file);
        const contents = await fs.readFile(filePath, encoding);

        if (shouldBackup) {
            await fs.copyFile(filePath, path.join(options.backupPath, file));
        }

        const from = arrify(options.from);
        const isArray = is.array(to);

        let newContents = contents;
        from.forEach((item, i) => {
            if (is.function(item)) {
                item = item(file);
            }

            let replacement = (isArray && is.undefined(to[i]))
                ? null
                : (isArray)
                    ? to[i]
                    : to;
            if (is.null(replacement)) {
                return;
            }

            if (is.function(replacement)) {
                const original = replacement;
                replacement = (...args) => original(...args, file);
            }

            newContents = newContents.replace(item, replacement);
        });

        if (newContents === contents) {
            return { file, hasChanged: false };
        }

        if (dry) {
            return { file, hasChanged: true };
        }

        await fs.writeFile(filePath, newContents, encoding);
        return { file, hasChanged: true };
    }));

    return results
        .filter((result) => result.hasChanged)
        .map((result) => result.file);
};
