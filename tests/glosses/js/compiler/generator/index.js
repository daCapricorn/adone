import getFixture from "../helper_fixtures";

const {
    js: { compiler: { types: t, parse, generate, CodeGenerator, Printer } },
    std: { fs, path }
} = adone;

describe("generation", () => {
    it("completeness", () => {
        Object.keys(t.VISITOR_KEYS).forEach((type) => {
            expect(Printer.prototype[type]).toBeTruthy();
        });

        Object.keys(Printer.prototype).forEach((type) => {
            if (!/[A-Z]/.test(type[0])) { return; }
            expect(t.VISITOR_KEYS[type]).toBeTruthy();
        });
    });

    it("multiple sources", () => {
        const sources = {
            "a.js": "function hi (msg) { console.log(msg); }\n",
            "b.js": "hi('hello');\n"
        };
        const parsed = Object.keys(sources).reduce((_parsed, filename) => {
            _parsed[filename] = parse(sources[filename], {
                sourceFilename: filename
            });
            return _parsed;
        }, {});

        const combinedAst = {
            type: "File",
            program: {
                type: "Program",
                sourceType: "module",
                body: [].concat(
                    parsed["a.js"].program.body,
                    parsed["b.js"].program.body,
                )
            }
        };

        const generated = generate(combinedAst, { sourceMaps: true }, sources);

        expect(generated.map).toEqual(
            {
                version: 3,
                sources: ["a.js", "b.js"],
                mappings:
                    // eslint-disable-next-line max-len
                    "AAAA,SAASA,EAAT,CAAaC,GAAb,EAAkB;AAAEC,EAAAA,OAAO,CAACC,GAAR,CAAYF,GAAZ;AAAmB;;ACAvCD,EAAE,CAAC,OAAD,CAAF",
                names: ["hi", "msg", "console", "log"],
                sourcesContent: [
                    "function hi (msg) { console.log(msg); }\n",
                    "hi('hello');\n"
                ]
            },
            "sourcemap was incorrectly generated",
        );

        expect(generated.rawMappings).toEqual(
            [
                {
                    name: undefined,
                    generated: { line: 1, column: 0 },
                    source: "a.js",
                    original: { line: 1, column: 0 }
                },
                {
                    name: "hi",
                    generated: { line: 1, column: 9 },
                    source: "a.js",
                    original: { line: 1, column: 9 }
                },
                {
                    name: undefined,
                    generated: { line: 1, column: 11 },
                    source: "a.js",
                    original: { line: 1, column: 0 }
                },
                {
                    name: "msg",
                    generated: { line: 1, column: 12 },
                    source: "a.js",
                    original: { line: 1, column: 13 }
                },
                {
                    name: undefined,
                    generated: { line: 1, column: 15 },
                    source: "a.js",
                    original: { line: 1, column: 0 }
                },
                {
                    name: undefined,
                    generated: { line: 1, column: 17 },
                    source: "a.js",
                    original: { line: 1, column: 18 }
                },
                {
                    name: "console",
                    generated: { line: 2, column: 0 },
                    source: "a.js",
                    original: { line: 1, column: 20 }
                },
                {
                    name: "console",
                    generated: { line: 2, column: 2 },
                    source: "a.js",
                    original: { line: 1, column: 20 }
                },
                {
                    name: undefined,
                    generated: { line: 2, column: 9 },
                    source: "a.js",
                    original: { line: 1, column: 27 }
                },
                {
                    name: "log",
                    generated: { line: 2, column: 10 },
                    source: "a.js",
                    original: { line: 1, column: 28 }
                },
                {
                    name: undefined,
                    generated: { line: 2, column: 13 },
                    source: "a.js",
                    original: { line: 1, column: 20 }
                },
                {
                    name: "msg",
                    generated: { line: 2, column: 14 },
                    source: "a.js",
                    original: { line: 1, column: 32 }
                },
                {
                    name: undefined,
                    generated: { line: 2, column: 17 },
                    source: "a.js",
                    original: { line: 1, column: 20 }
                },
                {
                    name: undefined,
                    generated: { line: 3, column: 0 },
                    source: "a.js",
                    original: { line: 1, column: 39 }
                },
                {
                    name: "hi",
                    generated: { line: 5, column: 0 },
                    source: "b.js",
                    original: { line: 1, column: 0 }
                },
                {
                    name: undefined,
                    generated: { line: 5, column: 2 },
                    source: "b.js",
                    original: { line: 1, column: 2 }
                },
                {
                    name: undefined,
                    generated: { line: 5, column: 3 },
                    source: "b.js",
                    original: { line: 1, column: 3 }
                },
                {
                    name: undefined,
                    generated: { line: 5, column: 10 },
                    source: "b.js",
                    original: { line: 1, column: 2 }
                },
                {
                    name: undefined,
                    generated: { line: 5, column: 11 },
                    source: "b.js",
                    original: { line: 1, column: 0 }
                }
            ],
            "raw mappings were incorrectly generated",
        );

        expect(generated.code).toBe(
            "function hi(msg) {\n  console.log(msg);\n}\n\nhi('hello');",
        );
    });

    it("identifierName", () => {
        const code = "function foo() { bar; }\n";

        const ast = parse(code, { filename: "inline" }).program;
        const fn = ast.body[0];

        const id = fn.id;
        id.name += "2";
        id.loc.identifierName = "foo";

        const id2 = fn.body.body[0].expression;
        id2.name += "2";
        id2.loc.identiferName = "bar";

        const generated = generate(
            ast,
            {
                filename: "inline",
                sourceFileName: "inline",
                sourceMaps: true
            },
            code,
        );

        expect(generated.map).toEqual(
            {
                version: 3,
                sources: ["inline"],
                names: ["foo", "bar"],
                mappings: "AAAA,SAASA,IAAT,GAAe;AAAEC,EAAAA,IAAG;AAAG",
                sourcesContent: ["function foo() { bar; }\n"]
            },
            "sourcemap was incorrectly generated",
        );

        expect(generated.rawMappings).toEqual(
            [
                {
                    name: undefined,
                    generated: { line: 1, column: 0 },
                    source: "inline",
                    original: { line: 1, column: 0 }
                },
                {
                    name: "foo",
                    generated: { line: 1, column: 9 },
                    source: "inline",
                    original: { line: 1, column: 9 }
                },
                {
                    name: undefined,
                    generated: { line: 1, column: 13 },
                    source: "inline",
                    original: { line: 1, column: 0 }
                },
                {
                    name: undefined,
                    generated: { line: 1, column: 16 },
                    source: "inline",
                    original: { line: 1, column: 15 }
                },
                {
                    name: "bar",
                    generated: { line: 2, column: 0 },
                    source: "inline",
                    original: { line: 1, column: 17 }
                },
                {
                    name: "bar",
                    generated: { line: 2, column: 2 },
                    source: "inline",
                    original: { line: 1, column: 17 }
                },
                {
                    name: undefined,
                    generated: { line: 2, column: 6 },
                    source: "inline",
                    original: { line: 1, column: 20 }
                },
                {
                    name: undefined,
                    generated: { line: 3, column: 0 },
                    source: "inline",
                    original: { line: 1, column: 23 }
                }
            ],
            "raw mappings were incorrectly generated",
        );

        expect(generated.code).toBe("function foo2() {\n  bar2;\n}");
    });

    it("lazy source map generation", () => {
        const code = "function hi (msg) { console.log(msg); }\n";

        const ast = parse(code, { filename: "a.js" }).program;
        const generated = generate(ast, {
            sourceFileName: "a.js",
            sourceMaps: true
        });

        expect(is.array(generated.rawMappings)).toBe(true);

        expect(
            Object.getOwnPropertyDescriptor(generated, "map"),
        ).not.toHaveProperty("value");

        expect(generated).toHaveProperty("map");
        expect(typeof generated.map).toBe("object");
    });
});

describe("programmatic generation", () => {
    it("numeric member expression", () => {
        // Should not generate `0.foo`
        const mem = t.memberExpression(
            t.numericLiteral(60702),
            t.identifier("foo"),
        );
        new Function(generate(mem).code);
    });

    it("nested if statements needs block", () => {
        const ifStatement = t.ifStatement(
            t.stringLiteral("top cond"),
            t.whileStatement(
                t.stringLiteral("while cond"),
                t.ifStatement(
                    t.stringLiteral("nested"),
                    t.expressionStatement(t.numericLiteral(1)),
                ),
            ),
            t.expressionStatement(t.stringLiteral("alt")),
        );

        const ast = parse(generate(ifStatement).code);
        expect(ast.program.body[0].consequent.type).toBe("BlockStatement");
    });

    it("prints directives in block with empty body", () => {
        const blockStatement = t.blockStatement(
            [],
            [t.directive(t.directiveLiteral("use strict"))],
        );

        const output = generate(blockStatement).code;
        expect(output).toBe(`{
  "use strict";
}`);
    });

    it("flow object indentation", () => {
        const objectStatement = t.objectTypeAnnotation(
            [t.objectTypeProperty(t.identifier("bar"), t.stringTypeAnnotation())],
            null,
            null,
            null,
        );

        const output = generate(objectStatement).code;
        expect(output).toBe(`{
  bar: string
}`);
    });

    it("flow object exact", () => {
        const objectStatement = t.objectTypeAnnotation(
            [t.objectTypeProperty(t.identifier("bar"), t.stringTypeAnnotation())],
            null,
            null,
            null,
            true,
        );

        const output = generate(objectStatement).code;
        expect(output).toBe(`{|
  bar: string
|}`);
    });

    it("flow object indentation with empty leading ObjectTypeProperty", () => {
        const objectStatement = t.objectTypeAnnotation(
            [],
            [
                t.objectTypeIndexer(
                    t.identifier("key"),
                    t.anyTypeAnnotation(),
                    t.numberTypeAnnotation(),
                )
            ],
            null,
        );

        const output = generate(objectStatement).code;

        expect(output).toBe(`{
  [key: any]: number
}`);
    });
});

describe("CodeGenerator", () => {
    it("generate", () => {
        const codeGen = new CodeGenerator(t.numericLiteral(123));
        const code = codeGen.generate().code;
        expect(parse(code).program.body[0].expression.value).toBe(123);
    });
});

const suites = getFixture(`${__dirname}/fixtures`);

suites.forEach((testSuite) => {
    describe(`generation/${testSuite.title}`, () => {
        testSuite.tests.forEach((task) => {
            const testFn = task.disabled ? it.skip : it;

            testFn(
                task.title,

                () => {
                    const expected = task.expect;
                    const actual = task.actual;
                    const actualCode = actual.code;

                    if (actualCode) {
                        const actualAst = parse(actualCode, {
                            filename: actual.loc,
                            plugins: task.options.plugins || [],
                            strictMode: false,
                            sourceType: "module",
                            sourceMaps: !!task.sourceMap,
                        });
                        const options = {
                            sourceFileName: path.relative(__dirname, actual.loc),
                            ...task.options,
                            sourceMaps: task.sourceMap ? true : task.options.sourceMaps,
                        };

                        const result = generate(actualAst, options, actualCode);

                        if (options.sourceMaps) {
                            expect(result.map).toEqual(task.sourceMap);
                        }

                        if (
                            !expected.code &&
                            result.code &&
                            fs.statSync(path.dirname(expected.loc)).isDirectory() &&
                            !process.env.CI
                        ) {
                            console.log(`New test file created: ${expected.loc}`);
                            fs.writeFileSync(expected.loc, result.code);
                        } else {
                            expect(result.code).toBe(expected.code);
                        }
                    }
                },
            );
        });
    });
});