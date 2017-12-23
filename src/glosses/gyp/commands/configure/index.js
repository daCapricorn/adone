const fs = require("graceful-fs");
const path = require("path");
const log = require("npmlog");
const osenv = require("osenv");
const which = require("which");
const semver = require("semver");
const mkdirp = require("mkdirp");
const cp = require("child_process");
const extend = require("util")._extend;
const processRelease = require("../../process-release");
const win = process.platform === "win32";
const findNodeDirectory = require("./find-node-directory");
const msgFormat = require("util").format;
let findVS2017;
if (win) {
    findVS2017 = require("../find-vs2017");
}

const {
    is
} = adone;

const PythonFinder = function (python, callback) {
    this.callback = callback;
    this.python = python;
};

PythonFinder.prototype = {
    checkPythonLauncherDepth: 0,
    env: process.env,
    execFile: cp.execFile,
    log,
    resolve: path.win32 && path.win32.resolve || path.resolve,
    stat: fs.stat,
    which,
    win,

    checkPython: function checkPython() {
        this.log.verbose("check python",
            'checking for Python executable "%s" in the PATH',
            this.python);
        this.which(this.python, (err, execPath) => {
            if (err) {
                this.log.verbose("`which` failed", this.python, err);
                if (this.python === "python2") {
                    this.python = "python";
                    return this.checkPython();
                }
                if (this.win) {
                    this.checkPythonLauncher();
                } else {
                    this.failNoPython();
                }
            } else {
                this.log.verbose("`which` succeeded", this.python, execPath);
                // Found the `python` executable, and from now on we use it explicitly.
                // This solves #667 and #750 (`execFile` won't run batch files
                // (*.cmd, and *.bat))
                this.python = execPath;
                this.checkPythonVersion();
            }
        });
    },

    // Distributions of Python on Windows by default install with the "py.exe"
    // Python launcher which is more likely to exist than the Python executable
    // being in the $PATH.
    // Because the Python launcher supports all versions of Python, we have to
    // explicitly request a Python 2 version. This is done by supplying "-2" as
    // the first command line argument. Since "py.exe -2" would be an invalid
    // executable for "execFile", we have to use the launcher to figure out
    // where the actual "python.exe" executable is located.
    checkPythonLauncher: function checkPythonLauncher() {
        this.checkPythonLauncherDepth += 1;

        this.log.verbose(
            `could not find "${this.python}". checking python launcher`);
        const env = extend({}, this.env);
        env.TERM = "dumb";

        const launcherArgs = ["-2", "-c", "import sys; print sys.executable"];
        this.execFile("py.exe", launcherArgs, { env }, (err, stdout) => {
            if (err) {
                this.guessPython();
            } else {
                this.python = stdout.trim();
                this.log.verbose("check python launcher",
                    "python executable found: %j",
                    this.python);
                this.checkPythonVersion();
            }
            this.checkPythonLauncherDepth -= 1;
        });
    },

    checkPythonVersion: function checkPythonVersion() {
        const args = ["-c", "import platform; print(platform.python_version());"];
        const env = extend({}, this.env);
        env.TERM = "dumb";

        this.execFile(this.python, args, { env }, (err, stdout) => {
            if (err) {
                return this.callback(err);
            }
            this.log.verbose("check python version",
                `\`%s -c "${args[1]}"\` returned: %j`,
                this.python, stdout);
            let version = stdout.trim();
            if (~version.indexOf("+")) {
                this.log.silly('stripping "+" sign(s) from version');
                version = version.replace(/\+/g, "");
            }
            if (~version.indexOf("rc")) {
                this.log.silly('stripping "rc" identifier from version');
                version = version.replace(/rc(.*)$/ig, "");
            }
            const range = semver.Range(">=2.5.0 <3.0.0");
            let valid = false;
            try {
                valid = range.test(version);
            } catch (e) {
                this.log.silly("range.test() error", e);
            }
            if (valid) {
                this.callback(null, this.python);
            } else if (this.win && this.checkPythonLauncherDepth === 0) {
                this.checkPythonLauncher();
            } else {
                this.failPythonVersion(version);
            }
        });
    },

    failNoPython: function failNoPython() {
        const errmsg =
            `Can't find Python executable "${this.python
            }", you can set the PYTHON env variable.`;
        this.callback(new Error(errmsg));
    },

    failPythonVersion: function failPythonVersion(badVersion) {
        const errmsg =
            `Python executable "${this.python
            }" is v${badVersion}, which is not supported by gyp.\n` +
            "You can pass the --python switch to point to " +
            "Python >= v2.5.0 & < 3.0.0.";
        this.callback(new Error(errmsg));
    },

    // Called on Windows when "python" isn't available in the current $PATH.
    // We are going to check if "%SystemDrive%\python27\python.exe" exists.
    guessPython: function guessPython() {
        this.log.verbose(`could not find "${this.python}". guessing location`);
        let rootDir = this.env.SystemDrive || "C:\\";
        if (rootDir[rootDir.length - 1] !== "\\") {
            rootDir += "\\";
        }
        const pythonPath = this.resolve(rootDir, "Python27", "python.exe");
        this.log.verbose("ensuring that file exists:", pythonPath);
        this.stat(pythonPath, (err, stat) => {
            if (err) {
                if (err.code === "ENOENT") {
                    this.failNoPython();
                } else {
                    this.callback(err);
                }
                return;
            }
            this.python = pythonPath;
            this.checkPythonVersion();
        });
    }
};

const findPython = function (python, callback) {
    const finder = new PythonFinder(python, callback);
    finder.checkPython();
};

/**
 * Returns the first file or directory from an array of candidates that is
 * readable by the current user, or undefined if none of the candidates are
 * readable.
 */
const findAccessibleSync = function (logprefix, dir, candidates) {
    for (let next = 0; next < candidates.length; next++) {
        const candidate = path.resolve(dir, candidates[next]);
        let fd;
        try {
            fd = fs.openSync(candidate, "r");
        } catch (e) {
            // this candidate was not found or not readable, do nothing
            log.silly(logprefix, "Could not open %s: %s", candidate, e.message);
            continue;
        }
        fs.closeSync(fd);
        log.silly(logprefix, "Found readable %s", candidate);
        return candidate;
    }

    return undefined;
};

const configure = function (gyp, argv, callback) {
    let python = gyp.opts.python || process.env.PYTHON || "python2";
    const buildDir = path.resolve("build");
    const configNames = ["config.gypi", "common.gypi"];
    const configs = [];
    let nodeDir;
    const release = processRelease(argv, gyp, process.version, process.release);

    /**
     * Called when the `gyp` child process exits.
     */

    const onCpExit = function (code, signal) {
        if (code !== 0) {
            return callback(new Error(`\`gyp\` failed with exit code: ${code}`));
        }
        // we're done
        callback();
    };

    const runGyp = function (err) {
        if (err) {
            return callback(err);
        }

        if (!~argv.indexOf("-f") && !~argv.indexOf("--format")) {
            if (win) {
                log.verbose("gyp", 'gyp format was not specified; forcing "msvs"');
                // force the 'make' target for non-Windows
                argv.push("-f", "msvs");
            } else {
                log.verbose("gyp", 'gyp format was not specified; forcing "make"');
                // force the 'make' target for non-Windows
                argv.push("-f", "make");
            }
        }

        const hasMsvsVersion = function () {
            return argv.some((arg) => {
                return arg.indexOf("msvs_version") === 0;
            });
        };

        if (win && !hasMsvsVersion()) {
            if ("msvs_version" in gyp.opts) {
                argv.push("-G", `msvs_version=${gyp.opts.msvs_version}`);
            } else {
                argv.push("-G", "msvs_version=auto");
            }
        }

        // include all the ".gypi" files that were found
        configs.forEach((config) => {
            argv.push("-I", config);
        });

        // for AIX we need to set up the path to the exp file
        // which contains the symbols needed for linking.
        // The file will either be in one of the following
        // depending on whether it is an installed or
        // development environment:
        //  - the include/node directory
        //  - the out/Release directory
        //  - the out/Debug directory
        //  - the root directory
        let nodeExpFile = undefined;
        if (process.platform === "aix" || process.platform === "os390") {
            const ext = process.platform === "aix" ? "exp" : "x";
            const nodeRootDir = findNodeDirectory();
            const candidates = ["include/node/node", "out/Release/node", "out/Debug/node", "node"].map((file) => `${file}.${ext}`);
            const logprefix = "find exports file";
            nodeExpFile = findAccessibleSync(logprefix, nodeRootDir, candidates);
            if (!is.undefined(nodeExpFile)) {
                log.verbose(logprefix, "Found exports file: %s", nodeExpFile);
            } else {
                const msg = msgFormat("Could not find node.%s file in %s", ext, nodeRootDir);
                log.error(logprefix, "Could not find exports file");
                return callback(new Error(msg));
            }
        }

        // this logic ported from the old `gyp_addon` python file
        const gypScript = path.resolve(__dirname, "..", "..", "native", "gyp", "gyp_main.py");
        const addonGypi = path.resolve(__dirname, "..", "..", "native", "addon.gypi");
        let commonGypi = path.resolve(nodeDir, "include/node/common.gypi");
        fs.stat(commonGypi, (err, stat) => {
            if (err) {
                commonGypi = path.resolve(nodeDir, "common.gypi");
            }

            let outputDir = "build";
            if (win) {
                // Windows expects an absolute path
                outputDir = buildDir;
            }
            const nodeGypDir = path.resolve(__dirname, "..");
            const nodeLibFile = path.join(nodeDir,
                !gyp.opts.nodedir ? "<(target_arch)" : "$(Configuration)",
                `${release.name}.lib`);

            argv.push("-I", addonGypi);
            argv.push("-I", commonGypi);
            argv.push("-Dlibrary=shared_library");
            argv.push("-Dvisibility=default");
            argv.push(`-Dnode_root_dir=${nodeDir}`);
            if (process.platform === "aix" || process.platform === "os390") {
                argv.push(`-Dnode_exp_file=${nodeExpFile}`);
            }
            argv.push(`-Dnode_gyp_dir=${nodeGypDir}`);
            argv.push(`-Dnode_lib_file=${nodeLibFile}`);
            argv.push(`-Dmodule_root_dir=${process.cwd()}`);
            argv.push(`-Dnode_engine=${
                gyp.opts.node_engine || process.jsEngine || "v8"}`);
            argv.push("--depth=.");
            argv.push("--no-parallel");

            // tell gyp to write the Makefile/Solution files into output_dir
            argv.push("--generator-output", outputDir);

            // tell make to write its output into the same dir
            argv.push("-Goutput_dir=.");

            // enforce use of the "binding.gyp" file
            argv.unshift("binding.gyp");

            // execute `gyp` from the current target nodedir
            argv.unshift(gypScript);

            // make sure python uses files that came with this particular node package
            const pypath = [path.join(__dirname, "..", "..", "native", "gyp", "pylib")];
            if (process.env.PYTHONPATH) {
                pypath.push(process.env.PYTHONPATH);
            }
            process.env.PYTHONPATH = pypath.join(win ? ";" : ":");

            const cp = gyp.spawn(python, argv);
            cp.on("exit", onCpExit);
        });
    };

    const findConfigs = function (err) {
        if (err) {
            return callback(err);
        }
        const name = configNames.shift();
        if (!name) {
            return runGyp();
        }
        const fullPath = path.resolve(name);
        log.verbose(name, "checking for gypi file: %s", fullPath);
        fs.stat(fullPath, (err, stat) => {
            if (err) {
                if (err.code === "ENOENT") {
                    findConfigs(); // check next gypi filename
                } else {
                    callback(err);
                }
            } else {
                log.verbose(name, "found gypi file");
                configs.push(fullPath);
                findConfigs();
            }
        });
    };

    const createConfigFile = function (err, vsSetup) {
        if (err) {
            return callback(err);
        }

        const configFilename = "config.gypi";
        const configPath = path.resolve(buildDir, configFilename);

        log.verbose(`build/${configFilename}`, "creating config file");

        const config = process.config || {};
        let defaults = config.target_defaults;
        let variables = config.variables;

        // default "config.variables"
        if (!variables) {
            variables = config.variables = {};
        }

        // default "config.defaults"
        if (!defaults) {
            defaults = config.target_defaults = {};
        }

        // don't inherit the "defaults" from node's `process.config` object.
        // doing so could cause problems in cases where the `node` executable was
        // compiled on a different machine (with different lib/include paths) than
        // the machine where the addon is being built to
        defaults.cflags = [];
        defaults.defines = [];
        defaults.include_dirs = [];
        defaults.libraries = [];

        // set the default_configuration prop
        if ("debug" in gyp.opts) {
            defaults.default_configuration = gyp.opts.debug ? "Debug" : "Release";
        }
        if (!defaults.default_configuration) {
            defaults.default_configuration = "Release";
        }

        // set the target_arch variable
        variables.target_arch = gyp.opts.arch || process.arch || "ia32";

        // set the node development directory
        variables.nodedir = nodeDir;

        // disable -T "thin" static archives by default
        variables.standalone_static_library = gyp.opts.thin ? 0 : 1;

        if (vsSetup) {
            // GYP doesn't (yet) have support for VS2017, so we force it to VS2015
            // to avoid pulling a floating patch that has not landed upstream.
            // Ref: https://chromium-review.googlesource.com/#/c/433540/
            gyp.opts.msvs_version = "2015";
            process.env.GYP_MSVS_VERSION = 2015;
            process.env.GYP_MSVS_OVERRIDE_PATH = vsSetup.path;
            defaults.msbuild_toolset = "v141";
            defaults.msvs_windows_target_platform_version = vsSetup.sdk;
            variables.msbuild_path = path.join(vsSetup.path, "MSBuild", "15.0",
                "Bin", "MSBuild.exe");
        }

        // loop through the rest of the opts and add the unknown ones as variables.
        // this allows for module-specific configure flags like:
        //
        //   $ node-gyp configure --shared-libxml2
        Object.keys(gyp.opts).forEach((opt) => {
            if (opt === "argv") {
                return;
            }
            if (opt in gyp.configDefs) {
                return;
            }
            variables[opt.replace(/-/g, "_")] = gyp.opts[opt];
        });

        // ensures that any boolean values from `process.config` get stringified
        const boolsToString = function (k, v) {
            if (is.boolean(v)) {
                return String(v);
            }
            return v;
        };

        log.silly(`build/${configFilename}`, config);

        // now write out the config.gypi file to the build/ dir
        const prefix = '# Do not edit. File was generated by node-gyp\'s "configure" step';
        const json = JSON.stringify(config, boolsToString, 2);
        log.verbose(`build/${configFilename}`, "writing out config file: %s", configPath);
        configs.push(configPath);
        fs.writeFile(configPath, [prefix, json, ""].join("\n"), findConfigs);
    };

    const createBuildDir = function () {
        log.verbose("build dir", 'attempting to create "build" dir: %s', buildDir);
        mkdirp(buildDir, (err, isNew) => {
            if (err) {
                return callback(err);
            }
            log.verbose("build dir", '"build" dir needed to be created?', isNew);
            if (win && (!gyp.opts.msvs_version || gyp.opts.msvs_version === "2017")) {
                findVS2017((err, vsSetup) => {
                    if (err) {
                        log.verbose("Not using VS2017:", err.message);
                        createConfigFile();
                    } else {
                        createConfigFile(null, vsSetup);
                    }
                });
            } else {
                createConfigFile();
            }
        });
    };

    const getNodeDir = function () {

        // 'python' should be set by now
        process.env.PYTHON = python;

        if (gyp.opts.nodedir) {
            // --nodedir was specified. use that for the dev files
            nodeDir = gyp.opts.nodedir.replace(/^~/, osenv.home());

            log.verbose("get node dir", "compiling against specified --nodedir dev files: %s", nodeDir);
            createBuildDir();

        } else {
            // if no --nodedir specified, ensure node dependencies are installed
            if (`v${release.version}` !== process.version) {
                // if --target was given, then determine a target version to compile for
                log.verbose("get node dir", "compiling against --target node version: %s", release.version);
            } else {
                // if no --target was specified then use the current host node version
                log.verbose("get node dir", "no --target version specified, falling back to host node version: %s", release.version);
            }

            if (!release.semver) {
                // could not parse the version string with semver
                return callback(new Error(`Invalid version number: ${release.version}`));
            }

            // If the tarball option is set, always remove and reinstall the headers
            // into devdir. Otherwise only install if they're not already there.
            gyp.opts.ensure = gyp.opts.tarball ? false : true;

            adone.gyp.command.install(gyp, [release.version], (err, version) => {
                if (err) {
                    return callback(err);
                }
                log.verbose("get node dir", "target node version installed:", release.versionDir);
                nodeDir = path.resolve(gyp.devDir, release.versionDir);
                createBuildDir();
            });
        }
    };

    findPython(python, (err, found) => {
        if (err) {
            callback(err);
        } else {
            python = found;
            getNodeDir();
        }
    });
};

module.exports = exports = configure;

exports.usage = `Generates ${win ? "MSVC project files" : "a Makefile"} for the current module`;

exports.test = {
    findNodeDirectory,
    PythonFinder,
    findAccessibleSync,
    findPython
};
