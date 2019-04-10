

const http = require("http");
const test = require("tap").test;
const serializers = require("../lib/req");
const wrapRequestSerializer = require("../").wrapRequestSerializer;

test("maps request", (t) => {
    t.plan(2);

    const server = http.createServer(handler);
    server.unref();
    server.listen(0, () => {
        http.get(server.address(), () => {});
    });

    t.tearDown(() => server.close());

    function handler(req, res) {
        const serialized = serializers.mapHttpRequest(req);
        t.ok(serialized.req);
        t.ok(serialized.req.method);
        t.end();
        res.end();
    }
});

test("does not return excessively long object", (t) => {
    t.plan(1);

    const server = http.createServer(handler);
    server.unref();
    server.listen(0, () => {
        http.get(server.address(), () => {});
    });

    t.tearDown(() => server.close());

    function handler(req, res) {
        const serialized = serializers.reqSerializer(req);
        t.is(Object.keys(serialized).length, 6);
        res.end();
    }
});

test("req.raw is available", (t) => {
    t.plan(2);

    const server = http.createServer(handler);
    server.unref();
    server.listen(0, () => {
        http.get(server.address(), () => {});
    });

    t.tearDown(() => server.close());

    function handler(req, res) {
        req.foo = "foo";
        const serialized = serializers.reqSerializer(req);
        t.ok(serialized.raw);
        t.is(serialized.raw.foo, "foo");
        res.end();
    }
});

test("req.raw will be obtained in from input request raw property if input request raw property is truthy", (t) => {
    t.plan(2);

    const server = http.createServer(handler);
    server.unref();
    server.listen(0, () => {
        http.get(server.address(), () => {});
    });

    t.tearDown(() => server.close());

    function handler(req, res) {
        req.raw = { req: { foo: "foo" }, res: {} };
        const serialized = serializers.reqSerializer(req);
        t.ok(serialized.raw);
        t.is(serialized.raw.req.foo, "foo");
        res.end();
    }
});

test("req.id defaults to undefined", (t) => {
    t.plan(1);

    const server = http.createServer(handler);
    server.unref();
    server.listen(0, () => {
        http.get(server.address(), () => {});
    });

    t.tearDown(() => server.close());

    function handler(req, res) {
        const serialized = serializers.reqSerializer(req);
        t.is(serialized.id, undefined);
        res.end();
    }
});

test("req.id has a non-function value", (t) => {
    t.plan(1);

    const server = http.createServer(handler);
    server.unref();
    server.listen(0, () => {
        http.get(server.address(), () => {});
    });

    t.tearDown(() => server.close());

    function handler(req, res) {
        const serialized = serializers.reqSerializer(req);
        t.is(is.function(serialized.id), false);
        res.end();
    }
});

test("req.id will be obtained from input request info.id when input request id does not exist", (t) => {
    t.plan(1);

    const server = http.createServer(handler);
    server.unref();
    server.listen(0, () => {
        http.get(server.address(), () => {});
    });

    t.tearDown(() => server.close());

    function handler(req, res) {
        req.info = { id: "test" };
        const serialized = serializers.reqSerializer(req);
        t.is(serialized.id, "test");
        res.end();
    }
});

test("req.id has a non-function value with custom id function", (t) => {
    t.plan(2);

    const server = http.createServer(handler);
    server.unref();
    server.listen(0, () => {
        http.get(server.address(), () => {});
    });

    t.tearDown(() => server.close());

    function handler(req, res) {
        req.id = function () {
            return 42; 
        };
        const serialized = serializers.reqSerializer(req);
        t.is(is.function(serialized.id), false);
        t.is(serialized.id, 42);
        res.end();
    }
});

test("req.url will be obtained from input request url.path when input request url is an object", (t) => {
    t.plan(1);

    const server = http.createServer(handler);
    server.unref();
    server.listen(0, () => {
        http.get(server.address(), () => {});
    });

    t.tearDown(() => server.close());

    function handler(req, res) {
        req.url = { path: "/test" };
        const serialized = serializers.reqSerializer(req);
        t.is(serialized.url, "/test");
        res.end();
    }
});

test("can wrap request serializers", (t) => {
    t.plan(3);

    const server = http.createServer(handler);
    server.unref();
    server.listen(0, () => {
        http.get(server.address(), () => {});
    });

    t.tearDown(() => server.close());

    const serailizer = wrapRequestSerializer((req) => {
        t.ok(req.method);
        t.is(req.method, "GET");
        delete req.method;
        return req;
    });

    function handler(req, res) {
        const serialized = serailizer(req);
        t.notOk(serialized.method);
        res.end();
    }
});

test("req.remoteAddress will be obtained from request connect.remoteAddress as fallback", (t) => {
    t.plan(1);

    const server = http.createServer(handler);
    server.unref();
    server.listen(0, () => {
        http.get(server.address(), () => {});
    });

    t.tearDown(() => server.close());

    function handler(req, res) {
        req.connection = { remoteAddress: "http://localhost" };
        const serialized = serializers.reqSerializer(req);
        t.is(serialized.remoteAddress, "http://localhost");
        res.end();
    }
});

test("req.remoteAddress will be obtained from request info.remoteAddress if available", (t) => {
    t.plan(1);

    const server = http.createServer(handler);
    server.unref();
    server.listen(0, () => {
        http.get(server.address(), () => {});
    });

    t.tearDown(() => server.close());

    function handler(req, res) {
        req.info = { remoteAddress: "http://localhost" };
        const serialized = serializers.reqSerializer(req);
        t.is(serialized.remoteAddress, "http://localhost");
        res.end();
    }
});

test("req.remotePort will be obtained from request connect.remotePort as fallback", (t) => {
    t.plan(1);

    const server = http.createServer(handler);
    server.unref();
    server.listen(0, () => {
        http.get(server.address(), () => {});
    });

    t.tearDown(() => server.close());

    function handler(req, res) {
        req.connection = { remotePort: 3000 };
        const serialized = serializers.reqSerializer(req);
        t.is(serialized.remotePort, 3000);
        res.end();
    }
});

test("req.remotePort will be obtained from request info.remotePort if available", (t) => {
    t.plan(1);

    const server = http.createServer(handler);
    server.unref();
    server.listen(0, () => {
        http.get(server.address(), () => {});
    });

    t.tearDown(() => server.close());

    function handler(req, res) {
        req.info = { remotePort: 3000 };
        const serialized = serializers.reqSerializer(req);
        t.is(serialized.remotePort, 3000);
        res.end();
    }
});