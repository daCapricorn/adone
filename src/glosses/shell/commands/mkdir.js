const common = require("../common");

const {
    is,
    std: { fs, path }
} = adone;

// Recursively creates `dir`
const mkdirSyncRecursive = function (dir) {
    const baseDir = path.dirname(dir);

    // Prevents some potential problems arising from malformed UNCs or
    // insufficient permissions.
    /* istanbul ignore next */
    if (baseDir === dir) {
        common.error(`dirname() failed: [${dir}]`);
    }

    // Base dir exists, no recursion necessary
    if (fs.existsSync(baseDir)) {
        fs.mkdirSync(dir, parseInt("0777", 8));
        return;
    }

    // Base dir does not exist, go recursive
    mkdirSyncRecursive(baseDir);

    // Base dir created, can create dir
    fs.mkdirSync(dir, parseInt("0777", 8));
};

//@
//@ ### mkdir([options,] dir [, dir ...])
//@ ### mkdir([options,] dir_array)
//@
//@ Available options:
//@
//@ + `-p`: full path (and create intermediate directories, if necessary)
//@
//@ Examples:
//@
//@ ```javascript
//@ mkdir('-p', '/tmp/a/b/c/d', '/tmp/e/f/g');
//@ mkdir('-p', ['/tmp/a/b/c/d', '/tmp/e/f/g']); // same as above
//@ ```
//@
//@ Creates directories.
const _mkdir = function (options, dirs) {
    if (!dirs) {
        common.error("no paths given");
    }

    if (is.string(dirs)) {
        dirs = [].slice.call(arguments, 1);
    }
    // if it's array leave it as it is

    dirs.forEach((dir) => {
        try {
            const stat = common.statNoFollowLinks(dir);
            if (!options.fullpath) {
                common.error(`path already exists: ${dir}`, { continue: true });
            } else if (stat.isFile()) {
                common.error(`cannot create directory ${dir}: File exists`, { continue: true });
            }
            return; // skip dir
        } catch (e) {
            // do nothing
        }

        // Base dir does not exist, and no -p option given
        const baseDir = path.dirname(dir);
        if (!fs.existsSync(baseDir) && !options.fullpath) {
            common.error(`no such file or directory: ${baseDir}`, { continue: true });
            return; // skip dir
        }

        try {
            if (options.fullpath) {
                mkdirSyncRecursive(path.resolve(dir));
            } else {
                fs.mkdirSync(dir, parseInt("0777", 8));
            }
        } catch (e) {
            let reason;
            if (e.code === "EACCES") {
                reason = "Permission denied";
            } else if (e.code === "ENOTDIR" || e.code === "ENOENT") {
                reason = "Not a directory";
            } else {
                /* istanbul ignore next */
                throw e;
            }
            common.error(`cannot create directory ${dir}: ${reason}`, { continue: true });
        }
    });
    return "";
}; // mkdir
module.exports = _mkdir;

common.register("mkdir", _mkdir, {
    cmdOptions: {
        p: "fullpath"
    }
});
