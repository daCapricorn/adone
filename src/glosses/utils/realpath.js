

module.exports = realpath;
realpath.realpath = realpath;
realpath.sync = realpathSync;
realpath.realpathSync = realpathSync;
realpath.async = adone.promise.promisify(realpath);

const fs = adone.std.fs;
const path = adone.std.path;
const origRealpath = fs.realpath;
const origRealpathSync = fs.realpathSync;

var version = process.version;
var ok = /^v[0-5]\./.test(version);

function newError (er) {
    return er && er.syscall === "realpath" && (
        er.code === "ELOOP" ||
        er.code === "ENOMEM" ||
        er.code === "ENAMETOOLONG"
    );
}

function realpath (p, cache, cb) {
    if (ok) {
        return origRealpath(p, cache, cb);
    }

    if (typeof cache === "function") {
        cb = cache;
        cache = null;
    }
    origRealpath(p, cache, function (er, result) {
        if (newError(er)) {
            old_realpath(p, cache, cb);
        } else {
            cb(er, result);
        }
    });
}

function realpathSync (p, cache) {
    if (ok) {
        return origRealpathSync(p, cache);
    }

    try {
        return origRealpathSync(p, cache);
    } catch (er) {
        if (newError(er)) {
            return old_realpathSync(p, cache);
        } else {
            throw er;
        }
    }
}

// JavaScript implementation of realpath, ported from node pre-v6
const isWindows = process.platform === "win32";
// Regexp that finds the next partion of a (partial) path
// result is [base_with_slash, base], e.g. ['somedir/', 'somedir']
if (isWindows) {
    var nextPartRe = /(.*?)(?:[\/\\]+|$)/g;
} else {
    var nextPartRe = /(.*?)(?:[\/]+|$)/g;
}

// Regex to find the device root, including trailing slash. E.g. 'c:\\'.
if (isWindows) {
    var splitRootRe = /^(?:[a-zA-Z]:|[\\\/]{2}[^\\\/]+[\\\/][^\\\/]+)?[\\\/]*/;
} else {
    var splitRootRe = /^[\/]*/;
}

function old_realpathSync(p, cache) {
    // make p is absolute
    p = path.resolve(p);

    if (cache && Object.prototype.hasOwnProperty.call(cache, p)) {
        return cache[p];
    }

    var original = p,
        seenLinks = {},
        knownHard = {};

    // current character position in p
    var pos;
    // the partial path so far, including a trailing slash if any
    var current;
    // the partial path without a trailing slash (except when pointing at a root)
    var base;
    // the partial path scanned in the previous round, with slash
    var previous;

    start();

    function start() {
        // Skip over roots
        var m = splitRootRe.exec(p);
        pos = m[0].length;
        current = m[0];
        base = m[0];
        previous = "";

        // On windows, check that the root exists. On unix there is no need.
        if (isWindows && !knownHard[base]) {
            fs.lstatSync(base);
            knownHard[base] = true;
        }
    }

    // walk down the path, swapping out linked pathparts for their real
    // values
    // NB: p.length changes.
    while (pos < p.length) {
        // find the next part
        nextPartRe.lastIndex = pos;
        var result = nextPartRe.exec(p);
        previous = current;
        current += result[0];
        base = previous + result[1];
        pos = nextPartRe.lastIndex;

        // continue if not a symlink
        if (knownHard[base] || (cache && cache[base] === base)) {
            continue;
        }

        var resolvedLink;
        if (cache && Object.prototype.hasOwnProperty.call(cache, base)) {
            // some known symbolic link.    no need to stat again.
            resolvedLink = cache[base];
        } else {
            var stat = fs.lstatSync(base);
            if (!stat.isSymbolicLink()) {
                knownHard[base] = true;
                if (cache) cache[base] = base;
                continue;
            }

            // read the link if it wasn't read before
            // dev/ino always return 0 on windows, so skip the check.
            var linkTarget = null;
            if (!isWindows) {
                var id = stat.dev.toString(32) + ":" + stat.ino.toString(32);
                if (seenLinks.hasOwnProperty(id)) {
                    linkTarget = seenLinks[id];
                }
            }
            if (linkTarget === null) {
                fs.statSync(base);
                linkTarget = fs.readlinkSync(base);
            }
            resolvedLink = path.resolve(previous, linkTarget);
            // track this, if given a cache.
            if (cache) cache[base] = resolvedLink;
            if (!isWindows) seenLinks[id] = linkTarget;
        }

        // resolve the link, then start over
        p = path.resolve(resolvedLink, p.slice(pos));
        start();
    }

    if (cache) cache[original] = p;

    return p;
}


function old_realpath(p, cache, cb) {
    if (typeof cb !== "function") {
        cb = cache;
        cache = null;
    }

    // make p is absolute
    p = path.resolve(p);

    if (cache && Object.prototype.hasOwnProperty.call(cache, p)) {
        return process.nextTick(cb.bind(null, null, cache[p]));
    }

    var original = p,
        seenLinks = {},
        knownHard = {};

    // current character position in p
    var pos;
    // the partial path so far, including a trailing slash if any
    var current;
    // the partial path without a trailing slash (except when pointing at a root)
    var base;
    // the partial path scanned in the previous round, with slash
    var previous;

    start();

    function start() {
        // Skip over roots
        var m = splitRootRe.exec(p);
        pos = m[0].length;
        current = m[0];
        base = m[0];
        previous = "";

        // On windows, check that the root exists. On unix there is no need.
        if (isWindows && !knownHard[base]) {
            fs.lstat(base, function(err) {
                if (err) return cb(err);
                knownHard[base] = true;
                LOOP();
            });
        } else {
            process.nextTick(LOOP);
        }
    }

    // walk down the path, swapping out linked pathparts for their real
    // values
    function LOOP() {
        // stop if scanned past end of path
        if (pos >= p.length) {
            if (cache) cache[original] = p;
            return cb(null, p);
        }

        // find the next part
        nextPartRe.lastIndex = pos;
        var result = nextPartRe.exec(p);
        previous = current;
        current += result[0];
        base = previous + result[1];
        pos = nextPartRe.lastIndex;

        // continue if not a symlink
        if (knownHard[base] || (cache && cache[base] === base)) {
            return process.nextTick(LOOP);
        }

        if (cache && Object.prototype.hasOwnProperty.call(cache, base)) {
            // known symbolic link.    no need to stat again.
            return gotResolvedLink(cache[base]);
        }

        return fs.lstat(base, gotStat);
    }

    function gotStat(err, stat) {
        if (err) return cb(err);

        // if not a symlink, skip to the next path part
        if (!stat.isSymbolicLink()) {
            knownHard[base] = true;
            if (cache) cache[base] = base;
            return process.nextTick(LOOP);
        }

        // stat & read the link if not read before
        // call gotTarget as soon as the link target is known
        // dev/ino always return 0 on windows, so skip the check.
        if (!isWindows) {
            var id = stat.dev.toString(32) + ":" + stat.ino.toString(32);
            if (seenLinks.hasOwnProperty(id)) {
                return gotTarget(null, seenLinks[id], base);
            }
        }
        fs.stat(base, function(err) {
            if (err) return cb(err);

            fs.readlink(base, function(err, target) {
                if (!isWindows) seenLinks[id] = target;
                gotTarget(err, target);
            });
        });
    }

    function gotTarget(err, target, base) {
        if (err) return cb(err);

        var resolvedLink = path.resolve(previous, target);
        if (cache) cache[base] = resolvedLink;
        gotResolvedLink(resolvedLink);
    }

    function gotResolvedLink(resolvedLink) {
        // resolve the link, then start over
        p = path.resolve(resolvedLink, p.slice(pos));
        start();
    }
}
