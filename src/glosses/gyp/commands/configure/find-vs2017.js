const log = require("npmlog");
const execFile = require("child_process").execFile;
const path = require("path");

const findVS2017 = function (callback) {
    const ps = path.join(process.env.SystemRoot, "System32", "WindowsPowerShell",
        "v1.0", "powershell.exe");
    const csFile = path.join(__dirname, "Find-VS2017.cs");
    const psArgs = ["-ExecutionPolicy", "Unrestricted", "-NoProfile",
        "-Command", `&{Add-Type -Path '${csFile}';` +
        "[VisualStudioConfiguration.Main]::Query()}"];

    log.silly("find vs2017", "Running", ps, psArgs);
    const child = execFile(ps, psArgs, { encoding: "utf8" },
        (err, stdout, stderr) => {
            log.silly("find vs2017", "PS err:", err);
            log.silly("find vs2017", "PS stdout:", stdout);
            log.silly("find vs2017", "PS stderr:", stderr);

            if (err) {
                return callback(new Error("Could not use PowerShell to find VS2017"));
            }

            let vsSetup;
            try {
                vsSetup = JSON.parse(stdout);
            } catch (e) {
                log.silly("find vs2017", e);
                return callback(new Error("Could not use PowerShell to find VS2017"));
            }
            log.silly("find vs2017", "vsSetup:", vsSetup);

            if (vsSetup && vsSetup.log) {
                log.verbose("find vs2017", vsSetup.log.trimRight());
            }

            if (!vsSetup || !vsSetup.path || !vsSetup.sdk) {
                return callback(new Error("No usable installation of VS2017 found"));
            }

            log.verbose("find vs2017", "using installation:", vsSetup.path);
            callback(null, { path: vsSetup.path, sdk: vsSetup.sdk });
        });

    child.stdin.end();
};

module.exports = findVS2017;
