const {
    is
} = adone;

describe("is", () => {
    const arrowFuncs = [
        (a, b) => a * b,
        () => 42,
        () => function () { },
        () => (x) => x * x,
        (x) => x * x,
        (x) => {
            return x * x;
        },
        (x, y) => {
            return x + x;
        }
    ];

    const asyncFuncs = [
        async (a, b) => a * b,
        async () => { },
        async function foo() { }
    ];

    const generatorFunction = function* () {
        const x = yield; return x || 42;
    };

    class Foo {}

    const CommentedClass = new Function("return class/*kkk*/\n//blah\n Bar\n//blah\n {}");

    describe("function()", () => {
        const noop = function () { };
        const classFake = function classFake() { }; // eslint-disable-line func-name-matching
        const returnClass = function () {
            return " class ";
        };
        const return3 = function () {
            return 3;
        };
        /**
         * for coverage
         */
        noop();
        classFake();
        returnClass();
        return3();

        describe("not callables", () => {
            it("non-number/string primitives", () => {
                assert.false(is.function(), "undefined is not function");
                assert.false(is.function(null), "null is not function");
                assert.false(is.function(false), "false is not function");
                assert.false(is.function(true), "true is not function");
            });

            assert.false(is.function([]), "array is not function");
            assert.false(is.function({}), "object is not function");
            assert.false(is.function(/a/g), "regex literal is not function");
            assert.false(is.function(new RegExp("a", "g")), "regex object is not function");
            assert.false(is.function(new Date()), "new Date() is not function");

            it("numbers", () => {
                assert.false(is.function(42), "number is not function");
                assert.false(is.function(Object(42)), "number object is not function");
                assert.false(is.function(NaN), "NaN is not function");
                assert.false(is.function(Infinity), "Infinity is not function");
            });

            it("strings", () => {
                assert.false(is.function("foo"), "string primitive is not function");
                assert.false(is.function(Object("foo")), "string object is not function");
            });

            it("non-function with function in its [[Prototype]] chain", () => {
                const Foo = function Bar() { };
                Foo.prototype = noop;
                assert.equal(true, is.function(Foo), "sanity check: Foo is function");
                assert.equal(false, is.function(new Foo()), "instance of Foo is not function");
            });
        });

        it("@@toStringTag", () => {
            const fakeFunction = {
                toString() {
                    return String(return3);
                },
                valueOf: return3
            };
            fakeFunction[Symbol.toStringTag] = "Function";
            assert.equal(String(fakeFunction), String(return3));
            assert.equal(Number(fakeFunction), return3());
            assert.false(is.function(fakeFunction), 'fake Function with @@toStringTag "Function" is not function');
        });

        const typedArrayNames = [
            "Int8Array",
            "Uint8Array",
            "Uint8ClampedArray",
            "Int16Array",
            "Uint16Array",
            "Int32Array",
            "Uint32Array",
            "Float32Array",
            "Float64Array"
        ];

        it("regular function", () => {
            assert.true(is.function(noop), "function is function");
            assert.true(is.function(classFake), 'function with name containing "class" is function');
            assert.true(is.function(returnClass), 'function with string " class " is function');
            assert.true(is.function(is.function), "is.function is function");
        });

        it("typed arrays", () => {
            for (const typedArray of typedArrayNames) {
                assert.true(is.function(global[typedArray]), `${typedArray} is function`);
            }
        });

        it("Generators", { skip: !generatorFunction }, () => {
            assert.true(is.function(generatorFunction), "generator function is function");
        });

        it("arrow functions", () => {
            arrowFuncs.forEach((arrowFunc) => {
                assert.true(is.function(arrowFunc), `arrow function ${arrowFunc} is arrow function`);
            });
        });

        it("async functions", () => {
            asyncFuncs.forEach((asyncFunc) => {
                assert.true(is.function(asyncFunc), `arrow function ${asyncFunc} is arrow function`);
            });
        });

        it("classes", () => {
            assert.true(is.function(Foo), "class constructor are function");
            assert.true(is.function(CommentedClass), "class constructor with comments in the signature are function");
        });
    });

    describe("arrowFunction()", () => {
        it("non-functions", () => {
            const nonFuncs = [
                true,
                false,
                null,
                undefined,
                {},
                [],
                /a/g,
                "string",
                42,
                new Date()
            ];
            for (const nonFunc of nonFuncs) {
                assert.false(is.arrowFunction(nonFunc), `${nonFunc} is not a function`);
            }
        });

        it("non-arrow functions", () => {
            const func = function () { };
            assert.false(is.arrowFunction(func), "anonymous function is not an arrow function");

            const namedFunc = function foo() { };
            assert.false(is.arrowFunction(namedFunc), "named function is not an arrow function");
        });

        it("non-arrow function with faked toString", () => {
            const func = function () { };
            func.toString = function () {
                return "ARROW";
            };

            assert.notEqual(String(func), Function.prototype.toString.call(func), "test function has faked toString that is different from default toString");
            assert.false(is.arrowFunction(func), "anonymous function with faked toString is not an arrow function");
        });

        it("arrow functions", () => {
            arrowFuncs.forEach((arrowFunc) => {
                assert.true(is.arrowFunction(arrowFunc), `arrow function ${arrowFunc} is arrow function`);
            });
        });

        it("async arrow functions", () => {
            asyncFuncs.slice(0, 2).forEach((asyncFunc) => {
                assert.true(is.arrowFunction(asyncFunc), `async arrow function ${asyncFunc} is arrow function`);
            });
            asyncFuncs.slice(2).forEach((asyncFunc) => {
                assert.false(is.arrowFunction(asyncFunc), `async non-arrow function ${asyncFunc} is not an arrow function`);
            });
        });
    });

    describe("asyncFunction()", () => {
        it("arrow functions", () => {
            arrowFuncs.forEach((arrowFunc) => {
                assert.false(is.asyncFunction(arrowFunc));
            });
        });

        it("generator function", () => {
            assert.false(is.asyncFunction(generatorFunction));
        });

        it("class", () => {
            assert.false(is.asyncFunction(Foo));
        });

        it("valid", () => {
            asyncFuncs.forEach((asyncFunc) => {
                assert.true(is.asyncFunction(asyncFunc));
            });
        });
    });

    describe("generatorFunction()", () => {
        it("arrow functions", () => {
            arrowFuncs.forEach((arrowFunc) => {
                assert.false(is.generatorFunction(arrowFunc), `${arrowFunc} is not a generator`);
            });
        });

        it("async functions", () => {
            asyncFuncs.forEach((asyncFunc) => {
                assert.false(is.generatorFunction(asyncFunc));
            });
        });

        it("class", () => {
            assert.false(is.asyncFunction(Foo));
        });

        it("valid", () => {
            assert.true(is.generatorFunction(generatorFunction));
        });
    });
});