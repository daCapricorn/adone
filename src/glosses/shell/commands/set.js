const common = require("../common");

common.register("set", _set, {
    allowGlobbing: false,
    wrapOutput: false
});

//@
//@ ### set(options)
//@
//@ Available options:
//@
//@ + `+/-e`: exit upon error (`config.fatal`)
//@ + `+/-v`: verbose: show all commands (`config.verbose`)
//@ + `+/-f`: disable filename expansion (globbing)
//@
//@ Examples:
//@
//@ ```javascript
//@ set('-e'); // exit upon first error
//@ set('+e'); // this undoes a "set('-e')"
//@ ```
//@
//@ Sets global configuration variables.
function _set(options) {
    if (!options) {
        let args = [].slice.call(arguments, 0);
        if (args.length < 2) { common.error('must provide an argument'); }
        options = args[1];
    }
    let negate = (options[0] === "+");
    if (negate) {
        options = "-" + options.slice(1); // parseOptions needs a '-' prefix
    }
    options = common.parseOptions(options, {
        "e": "fatal",
        v: "verbose",
        "f": "noglob"
    });

    if (negate) {
        Object.keys(options).forEach((key) => {
            options[key] = !options[key];
        });
    }

    Object.keys(options).forEach((key) => {
        // Only change the global config if `negate` is false and the option is true
        // or if `negate` is true and the option is false (aka negate !== option)
        if (negate !== options[key]) {
            common.config[key] = options[key];
        }
    });

}
module.exports = _set;
