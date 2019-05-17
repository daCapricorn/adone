const {
    is
} = adone;

const colors = { enabled: true, visible: true, styles: {}, keys: {} };

if ("FORCE_COLOR" in process.env) {
    colors.enabled = process.env.FORCE_COLOR !== "0";
}

const ansi = (style) => {
    style.open = `\u001b[${style.codes[0]}m`;
    style.close = `\u001b[${style.codes[1]}m`;
    style.regex = new RegExp(`\\u001b\\[${style.codes[1]}m`, "g");
    return style;
};

const wrap = (style, str, nl) => {
    const { open, close, regex } = style;
    str = open + (str.includes(close) ? str.replace(regex, close + open) : str) + close;
    // see https://github.com/chalk/chalk/pull/92, thanks to the
    // chalk contributors for this fix. However, we've confirmed that
    // this issue is also present in Windows terminals
    return nl ? str.replace(/\r?\n/g, `${close}$&${open}`) : str;
};

const style = (input, stack) => {
    if (input === "" || is.nil(input)) {
        return "";
    }
    if (colors.enabled === false) {
        return input;
    }
    if (colors.visible === false) {
        return "";
    }
    let str = `${input}`;
    const nl = str.includes("\n");
    let n = stack.length;
    while (n-- > 0) {
        str = wrap(colors.styles[stack[n]], str, nl);
    }
    return str;
};

const define = (name, codes, type) => {
    colors.styles[name] = ansi({ name, codes });
    const t = colors.keys[type] || (colors.keys[type] = []);
    t.push(name);

    Reflect.defineProperty(colors, name, {
        get() {
            const color = (input) => style(input, color.stack);
            Reflect.setPrototypeOf(color, colors);
            color.stack = this.stack ? this.stack.concat(name) : [name];
            return color;
        }
    });
};

define("reset", [0, 0], "modifier");
define("bold", [1, 22], "modifier");
define("dim", [2, 22], "modifier");
define("italic", [3, 23], "modifier");
define("underline", [4, 24], "modifier");
define("inverse", [7, 27], "modifier");
define("hidden", [8, 28], "modifier");
define("strikethrough", [9, 29], "modifier");

define("black", [30, 39], "color");
define("red", [31, 39], "color");
define("green", [32, 39], "color");
define("yellow", [33, 39], "color");
define("blue", [34, 39], "color");
define("magenta", [35, 39], "color");
define("cyan", [36, 39], "color");
define("white", [37, 39], "color");
define("gray", [90, 39], "color");
define("grey", [90, 39], "color");

define("bgBlack", [40, 49], "bg");
define("bgRed", [41, 49], "bg");
define("bgGreen", [42, 49], "bg");
define("bgYellow", [43, 49], "bg");
define("bgBlue", [44, 49], "bg");
define("bgMagenta", [45, 49], "bg");
define("bgCyan", [46, 49], "bg");
define("bgWhite", [47, 49], "bg");

define("blackBright", [90, 39], "bright");
define("redBright", [91, 39], "bright");
define("greenBright", [92, 39], "bright");
define("yellowBright", [93, 39], "bright");
define("blueBright", [94, 39], "bright");
define("magentaBright", [95, 39], "bright");
define("cyanBright", [96, 39], "bright");
define("whiteBright", [97, 39], "bright");

define("bgBlackBright", [100, 49], "bgBright");
define("bgRedBright", [101, 49], "bgBright");
define("bgGreenBright", [102, 49], "bgBright");
define("bgYellowBright", [103, 49], "bgBright");
define("bgBlueBright", [104, 49], "bgBright");
define("bgMagentaBright", [105, 49], "bgBright");
define("bgCyanBright", [106, 49], "bgBright");
define("bgWhiteBright", [107, 49], "bgBright");

/**
 * eslint-disable no-control-regex
 */
// this is a modified, optimized version of
// https://github.com/chalk/ansi-regex (MIT License)
const re = colors.ansiRegex = /[\u001b\u009b][[\]#;?()]*(?:(?:(?:[^\W_]*;?[^\W_]*)\u0007)|(?:(?:[0-9]{1,4}(;[0-9]{0,4})*)?[~0-9=<>cf-nqrtyA-PRZ]))/g;

colors.hasColor = colors.hasAnsi = (str) => {
    re.lastIndex = 0;
    return Boolean(str) && is.string(str) && re.test(str);
};

colors.unstyle = (str) => {
    re.lastIndex = 0;
    return is.string(str) ? str.replace(re, "") : str;
};

colors.none = colors.clear = colors.noop = (str) => str; // no-op, for programmatic usage
colors.stripColor = colors.unstyle;



const isWindows = process.platform === "win32";
const isLinux = process.platform === "linux";

const windows = {
    bullet: "•",
    check: "√",
    cross: "×",
    ellipsis: "...",
    heart: "❤",
    info: "i",
    line: "─",
    middot: "·",
    minus: "－",
    plus: "＋",
    question: "?",
    questionSmall: "﹖",
    pointer: ">",
    pointerSmall: "»",
    warning: "‼"
};

const other = {
    ballotCross: "✘",
    bullet: "•",
    check: "✔",
    cross: "✖",
    ellipsis: "…",
    heart: "❤",
    info: "ℹ",
    line: "─",
    middot: "·",
    minus: "－",
    plus: "＋",
    question: "?",
    questionFull: "？",
    questionSmall: "﹖",
    pointer: isLinux ? "▸" : "❯",
    pointerSmall: isLinux ? "‣" : "›",
    warning: "⚠"
};

colors.symbols = isWindows ? windows : other;
Reflect.defineProperty(colors.symbols, "windows", { enumerable: false, value: windows });
Reflect.defineProperty(colors.symbols, "other", { enumerable: false, value: other });

colors.define = define;
module.exports = colors;


