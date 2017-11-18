const { net: { ws: { exts } } } = adone;

describe("net", "ws", "Extensions", () => {
    describe("parse", () => {
        it("returns an empty object if the argument is undefined", () => {
            assert.deepStrictEqual(exts.parse(), {});
            assert.deepStrictEqual(exts.parse(""), {});
        });

        it("parses a single extension", () => {
            const extensions = exts.parse("foo");

            assert.deepStrictEqual(extensions, { foo: [{}] });
        });

        it("parses params", () => {
            const extensions = exts.parse("foo;bar;baz=1;bar=2");

            assert.deepStrictEqual(extensions, {
                foo: [{ bar: [true, "2"], baz: ["1"] }]
            });
        });

        it("parses multiple extensions", () => {
            const extensions = exts.parse("foo,bar;baz,foo;baz");

            assert.deepStrictEqual(extensions, {
                foo: [{}, { baz: [true] }],
                bar: [{ baz: [true] }]
            });
        });

        it("parses quoted params", () => {
            assert.deepStrictEqual(exts.parse('foo;bar="hi"'), {
                foo: [{ bar: ["hi"] }]
            });
            assert.deepStrictEqual(exts.parse('foo;bar="\\0"'), {
                foo: [{ bar: ["0"] }]
            });
            assert.deepStrictEqual(exts.parse('foo;bar="b\\a\\z"'), {
                foo: [{ bar: ["baz"] }]
            });
            assert.deepStrictEqual(exts.parse('foo;bar="b\\az";bar'), {
                foo: [{ bar: ["baz", true] }]
            });
            assert.throws(
                () => exts.parse('foo;bar="baz"qux'),
                /^unexpected character at index 13$/
            );
            assert.throws(
                () => exts.parse('foo;bar="baz" qux'),
                /^unexpected character at index 14$/
            );
        });

        it("works with names that match Object.prototype property names", () => {
            const parse = exts.parse;

            assert.deepStrictEqual(parse("hasOwnProperty, toString"), {
                hasOwnProperty: [{}],
                toString: [{}]
            });
            assert.deepStrictEqual(parse("foo;constructor"), {
                foo: [{ constructor: [true] }]
            });
        });

        it("ignores the optional white spaces", () => {
            const header = 'foo; bar\t; \tbaz=1\t ;  bar="1"\t\t, \tqux\t ;norf ';

            assert.deepStrictEqual(exts.parse(header), {
                foo: [{ bar: [true, "1"], baz: ["1"] }],
                qux: [{ norf: [true] }]
            });
        });

        it("throws an error if a name is empty", () => {
            [
                [",", 0],
                ["foo,,", 4],
                ["foo,  ,", 6],
                ["foo;=", 4],
                ["foo; =", 5],
                ["foo;;", 4],
                ["foo; ;", 5],
                ["foo;bar=,", 8],
                ['foo;bar=""', 9]
            ].forEach((element) => {
                assert.throws(
                    () => exts.parse(element[0]),
                    new RegExp(`^unexpected character at index ${element[1]}$`)
                );
            });
        });

        it("throws an error if a white space is misplaced", () => {
            [
                ["f oo", 2],
                ["foo;ba r", 7],
                ["foo;bar =", 8],
                ["foo;bar= ", 8]
            ].forEach((element) => {
                assert.throws(
                    () => exts.parse(element[0]),
                    new RegExp(`^unexpected character at index ${element[1]}$`)
                );
            });
        });

        it("throws an error if a token contains invalid characters", () => {
            [
                ["f@o", 1],
                ["f\\oo", 1],
                ['"foo"', 0],
                ['f"oo"', 1],
                ["foo;b@r", 5],
                ["foo;b\\ar", 5],
                ['foo;"bar"', 4],
                ['foo;b"ar"', 5],
                ["foo;bar=b@z", 9],
                ["foo;bar=b\\az ", 9],
                ['foo;bar="b@z"', 10],
                ['foo;bar="baz;"', 12],
                ['foo;bar=b"az"', 9],
                ['foo;bar="\\\\"', 10]
            ].forEach((element) => {
                assert.throws(
                    () => exts.parse(element[0]),
                    new RegExp(`^unexpected character at index ${element[1]}$`)
                );
            });
        });

        it("throws an error if the header value ends prematurely", () => {
            [
                "foo, ",
                "foo;",
                "foo;bar,",
                "foo;bar; ",
                "foo;bar=",
                'foo;bar="baz',
                'foo;bar="1\\'
            ].forEach((header) => {
                assert.throws(
                    () => exts.parse(header),
                    /^unexpected end of input$/
                );
            });
        });
    });

    describe("format", () => {
        it("formats a single extension", () => {
            const extensions = exts.format({ foo: {} });

            assert.strictEqual(extensions, "foo");
        });

        it("formats params", () => {
            const extensions = exts.format({ foo: { bar: [true, 2], baz: 1 } });

            assert.strictEqual(extensions, "foo; bar; bar=2; baz=1");
        });

        it("formats multiple extensions", () => {
            const extensions = exts.format({
                foo: [{}, { baz: true }],
                bar: { baz: true }
            });

            assert.strictEqual(extensions, "foo, foo; baz, bar; baz");
        });
    });
});
