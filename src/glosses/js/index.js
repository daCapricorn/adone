adone.lazify({
    compiler: "./compiler",
    coverage: "./coverage",
    Module: "./module",
    esutils: "./esutils",
    tokTypes: ["./parser", (mod) => mod.tokTypes],
    parse: ["./parser", (mod) => mod.parse],
    parseExpression: ["./parser", (mod) => mod.parseExpression],
    parseFunction: "./parse_function",
    walk: "./walk",
    tokens: "./tokens",
    highlight: "./highlight"
}, adone.asNamespace(exports), require);
