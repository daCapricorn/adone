import SourceMap from "./source_map";
import Printer from "./printer";

const {
    is
} = adone;

/**
 * Normalize generator options, setting defaults.
 *
 * - Detects code indentation.
 * - If `opts.compact = "auto"` and the code is over 500KB, `compact` will be set to `true`.
 */

const normalizeOptions = function (code, opts) {
    const format = {
        auxiliaryCommentBefore: opts.auxiliaryCommentBefore,
        auxiliaryCommentAfter: opts.auxiliaryCommentAfter,
        shouldPrintComment: opts.shouldPrintComment,
        retainLines: opts.retainLines,
        retainFunctionParens: opts.retainFunctionParens,
        comments: is.nil(opts.comments) || opts.comments,
        compact: opts.compact,
        minified: opts.minified,
        concise: opts.concise,
        jsonCompatibleStrings: opts.jsonCompatibleStrings,
        indent: {
            adjustMultilineComment: true,
            style: "  ",
            base: 0
        },
        decoratorsBeforeExport: Boolean(opts.decoratorsBeforeExport),
        jsescOption: {
            quotes: "double",
            wrap: true,
            ...opts.jsescOption
        }
    };

    if (format.minified) {
        format.compact = true;

        format.shouldPrintComment =
            format.shouldPrintComment || (() => format.comments);
    } else {
        format.shouldPrintComment =
            format.shouldPrintComment ||
            ((value) =>
                format.comments ||
                (value.includes("@license") || value.includes("@preserve")));
    }

    if (format.compact === "auto") {
        format.compact = code.length > 500_000; // 500KB

        if (format.compact) {
            console.error(
                "[BABEL] Note: The code generator has deoptimised the styling of " +
                `${opts.filename} as it exceeds the max of ${"500KB"}.`,
            );
        }
    }

    if (format.compact) {
        format.indent.adjustMultilineComment = false;
    }

    return format;
};

/**
 * Babel's code generator, turns an ast into code, maintaining sourcemaps,
 * user preferences, and valid output.
 */

class Generator extends Printer {
    constructor(ast, opts = {}, code) {
        const format = normalizeOptions(code, opts);
        const map = opts.sourceMaps ? new SourceMap(opts, code) : null;
        super(format, map);

        this.ast = ast;
    }

    ast;

    /**
     * Generate code and sourcemap from ast.
     *
     * Appends comments that weren't attached to any node to the end of the generated output.
     */

    generate() {
        return super.generate(this.ast);
    }
}


/**
 * We originally exported the Generator class above, but to make it extra clear that it is a private API,
 * we have moved that to an internal class instance and simplified the interface to the two public methods
 * that we wish to support.
 */

export class CodeGenerator {
    constructor(ast, opts, code) {
        this._generator = new Generator(ast, opts, code);
    }

    generate() {
        return this._generator.generate();
    }
}

export default function (ast, opts, code) {
    const gen = new Generator(ast, opts, code);
    return gen.generate();
}
