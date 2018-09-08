import File from "./file/file";
import generateMissingPluginMessage from "./util/missing-plugin-helper";

const {
    is,
    js: { compiler: { types: t, parse, codeFrameColumns } },
    std: { path },
    sourcemap: { convert },
    lodash: { cloneDeep }
} = adone;

const parser = function (pluginPasses, { parserOpts, highlightCode = true, filename = "unknown" }, code) {
    try {
        const results = [];
        for (const plugins of pluginPasses) {
            for (const plugin of plugins) {
                const { parserOverride } = plugin;
                if (parserOverride) {
                    const ast = parserOverride(code, parserOpts, parse);

                    if (!is.undefined(ast)) {
                        results.push(ast);
                    }
                }
            }
        }

        if (results.length === 0) {
            return parse(code, parserOpts);
        } else if (results.length === 1) {
            if (is.function(results[0].then)) {
                throw new Error(
                    "You appear to be using an async codegen plugin, " +
                    "which your current version of Babel does not support. " +
                    "If you're using a published plugin, you may need to upgrade " +
                    "your @babel/core version.",
                );
            }
            return results[0];
        }
        throw new Error("More than one plugin attempted to override parsing.");
    } catch (err) {
        if (err.code === "BABEL_PARSER_SOURCETYPE_MODULE_REQUIRED") {
            err.message +=
                "\nConsider renaming the file to '.mjs', or setting sourceType:module " +
                "or sourceType:unambiguous in your Babel config for this file.";
        }

        const { loc, missingPlugin } = err;
        if (loc) {
            const codeFrame = codeFrameColumns(
                code,
                {
                    start: {
                        line: loc.line,
                        column: loc.column + 1
                    }
                },
                {
                    highlightCode
                },
            );
            if (missingPlugin) {
                err.message = `${filename}: ${generateMissingPluginMessage(missingPlugin[0], loc, codeFrame)}`;
            } else {
                err.message = `${filename}: ${err.message}\n\n${codeFrame}`;
            }
            err.code = "BABEL_PARSE_ERROR";
        }
        throw err;
    }
};

export default function normalizeFile(pluginPasses, options, code, ast) {
    code = `${code || ""}`;

    let inputMap = null;
    if (options.inputSourceMap !== false) {
        // If an explicit object is passed in, it overrides the processing of
        // source maps that may be in the file itself.
        if (typeof options.inputSourceMap === "object") {
            inputMap = convert.fromObject(options.inputSourceMap);
        }

        if (!inputMap) {
            try {
                inputMap = convert.fromSource(code);

                if (inputMap) {
                    code = convert.removeComments(code);
                }
            } catch (err) {
                code = convert.removeComments(code);
            }
        }

        if (!inputMap) {
            if (is.string(options.filename)) {
                try {
                    inputMap = convert.fromMapFileSource(
                        code,
                        path.dirname(options.filename),
                    );

                    if (inputMap) {
                        code = convert.removeMapFileComments(code);
                    }
                } catch (err) {
                    code = convert.removeMapFileComments(code);
                }
            } else {
                code = convert.removeMapFileComments(code);
            }
        }
    }

    if (ast) {
        if (ast.type === "Program") {
            ast = t.file(ast, [], []);
        } else if (ast.type !== "File") {
            throw new Error("AST root must be a Program or File node");
        }
        ast = cloneDeep(ast);
    } else {
        // The parser's AST types aren't fully compatible with the types generated
        // by the logic in babel-types.
        // $FlowFixMe
        ast = parser(pluginPasses, options, code);
    }

    return new File(options, {
        code,
        ast,
        inputMap
    });
}
