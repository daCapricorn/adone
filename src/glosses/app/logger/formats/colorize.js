const {
    is,
    terminal: { chalk }
} = adone;

/**
 * @property {RegExp} hasSpace
 * Simple regex to check for presence of spaces.
 */
const hasSpace = /\s+/;

/**
 * Colorizer format. Wraps the `level` and/or `message` properties
 * of the `info` objects with ANSI color codes based on a few options.
 */
class Colorizer {
    constructor(opts = {}) {
        if (opts.colors) {
            this.addColors(opts.colors);
        }

        this.options = opts;
    }

    /**
     * Adds the colors Object to the set of allColors
     * known by the Colorizer
     *
     * @param {Object} colors Set of color mappings to add.
     */
    static addColors(clrs) {
        const nextColors = Object.keys(clrs).reduce((acc, level) => {
            acc[level] = hasSpace.test(clrs[level])
                ? clrs[level].split(hasSpace)
                : clrs[level];

            return acc;
        }, {});

        Colorizer.allColors = Object.assign({}, Colorizer.allColors || {}, nextColors);
        return Colorizer.allColors;
    }

    /**
     * Adds the colors Object to the set of allColors
     * known by the Colorizer
     *
     * @param {Object} colors Set of color mappings to add.
     */
    addColors(clrs) {
        return Colorizer.addColors(clrs);
    }

    /**
     * function colorize (lookup, level, message)
     * Performs multi-step colorization using colors/safe
     */
    colorize(lookup, level, message) {
        if (is.undefined(message)) {
            message = level;
        }

        //
        // If the color for the level is just a string
        // then attempt to colorize the message with it.
        //
        if (!is.array(Colorizer.allColors[lookup])) {
            return chalk[Colorizer.allColors[lookup]](message);
        }

        //
        // If it is an Array then iterate over that Array, applying
        // the colors function for each item.
        //
        for (let i = 0, len = Colorizer.allColors[lookup].length; i < len; i++) {
            message = chalk[Colorizer.allColors[lookup][i]](message);
        }

        return message;
    }

    /**
     * function transform (info, opts)
     * Attempts to colorize the { level, message } of the given
     * `logform` info object.
     */
    transform(info, opts) {
        if (opts.level || opts.all || !opts.message) {
            info.level = this.colorize(info[adone.app.logger.LEVEL], info.level);
        }

        if (opts.all || opts.message) {
            info.message = this.colorize(info[adone.app.logger.LEVEL], info.level, info.message);
        }

        return info;
    }
}

/**
 * function colorize (info)
 * Returns a new instance of the colorize Format that applies
 * level colors to `info` objects.
 */
const colorize = (opts) => new Colorizer(opts);
colorize.Colorizer = Colorizer;

export default colorize;
