const { is, x, shani: { util: sutil } } = adone;
const {
    __: {
        util: { functionToString, getPropertyDescriptor, wrapMethod, format: sformat, valueToString },
        spyFormatters: formatters,
        SpyCall
    },
    match
} = sutil;

const deepEqual = sutil.__.util.deepEqual.use(match);

let callId = 0;
const ErrorConstructor = Error.prototype.constructor;

const matchingFake = (fakes, args, strict) => {
    if (!fakes) {
        return undefined;
    }

    const matchingFakes = fakes.filter((fake) => fake.matches(args, strict));

    return matchingFakes.pop();
};

const incrementCallCount = function () {
    this.called = true;
    this.callCount += 1;
    this.notCalled = false;
    this.calledOnce = this.callCount === 1;
    this.calledTwice = this.callCount === 2;
    this.calledThrice = this.callCount === 3;
};

const createCallProperties = function () {
    this.firstCall = this.getCall(0);
    this.secondCall = this.getCall(1);
    this.thirdCall = this.getCall(2);
    this.lastCall = this.getCall(this.callCount - 1);
};

const createProxy = (func, proxyLength) => {
    // Retain the function length:
    let proxy;
    if (proxyLength) {
        switch (proxyLength) {
            case 1: {
                proxy = function proxy(a) {
                    return proxy.invoke(func, this, [a]);
                };
                break;
            }
            case 2: {
                proxy = function proxy(a, b) {
                    return proxy.invoke(func, this, [a, b]);
                }; break;
            }
            case 3: {
                proxy = function proxy(a, b, c) {
                    return proxy.invoke(func, this, [a, b, c]);
                };
                break;
            }
            case 4: {
                proxy = function proxy(a, b, c, d) {
                    return proxy.invoke(func, this, [a, b, c, d]);
                };
                break;
            }
            case 5: {
                proxy = function proxy(a, b, c, d, e) {
                    return proxy.invoke(func, this, [a, b, c, d, e]);
                };
                break;
            }
            case 6: {
                proxy = function proxy(a, b, c, d, e, f) {
                    return proxy.invoke(func, this, [a, b, c, d, e, f]);
                };
                break;
            }
            case 7: {
                proxy = function proxy(a, b, c, d, e, f, g) {
                    return proxy.invoke(func, this, [a, b, c, d, e, f, g]);
                };
                break;
            }
            case 8: {
                proxy = function proxy(a, b, c, d, e, f, g, h) {
                    return proxy.invoke(func, this, [a, b, c, d, e, f, g, h]);
                };
                break;
            }
            case 9: {
                proxy = function proxy(a, b, c, d, e, f, g, h, i) {
                    return proxy.invoke(func, this, [a, b, c, d, e, f, g, h, i]);
                };
                break;
            }
            case 10: {
                proxy = function proxy(a, b, c, d, e, f, g, h, i, j) {
                    return proxy.invoke(func, this, [a, b, c, d, e, f, g, h, i, j]);
                };
                break;
            }
            case 11: {
                proxy = function proxy(a, b, c, d, e, f, g, h, i, j, k) {
                    return proxy.invoke(func, this, [a, b, c, d, e, f, g, h, i, j, k]);
                };
                break;
            }
            case 12: {
                proxy = function proxy(a, b, c, d, e, f, g, h, i, j, k, l) {
                    return proxy.invoke(func, this, [a, b, c, d, e, f, g, h, i, j, k, l]);
                };
                break;
            }
            default: {
                proxy = function proxy(...args) {
                    return proxy.invoke(func, this, args);
                };
                break;
            }
        }
    } else {
        proxy = function proxy(...args) {
            return proxy.invoke(func, this, args);
        };
    }
    proxy.isSinonProxy = true;
    return proxy;
};

let uuid = 0;

// Public API
const proto = {
    formatters,
    reset() {
        if (this.invoking) {
            const err = new Error("Cannot reset Sinon function while invoking it. " +
                                "Move the call to .reset outside of the callback.");
            err.name = "InvalidResetException";
            throw err;
        }

        this.called = false;
        this.notCalled = true;
        this.calledOnce = false;
        this.calledTwice = false;
        this.calledThrice = false;
        this.callCount = 0;
        this.firstCall = null;
        this.secondCall = null;
        this.thirdCall = null;
        this.lastCall = null;
        this.args = [];
        this.returnValues = [];
        this.thisValues = [];
        this.exceptions = [];
        this.callIds = [];
        this.callAwaiters = [];
        this.errorsWithCallStack = [];
        if (this.fakes) {
            this.fakes.forEach((fake) => {
                if (fake.resetHistory) {
                    fake.resetHistory();
                } else {
                    fake.reset();
                }
            });
        }

        return this;
    },
    create(func, spyLength) {
        let name;

        if (!is.function(func)) {
            func = function () { };
        } else {
            name = adone.util.functionName(func);
        }

        if (!spyLength) {
            spyLength = func.length;
        }

        const proxy = createProxy(func, spyLength);

        Object.assign(proxy, spy);
        delete proxy.create;
        Object.assign(proxy, func);

        proxy.reset();
        proxy.prototype = func.prototype;
        proxy.displayName = name || "spy";
        proxy.toString = functionToString;
        proxy.instantiateFake = spy.create;
        proxy.id = `spy#${uuid++}`;

        return proxy;
    },
    invoke(func, thisValue, args) {
        const matching = matchingFake(this.fakes, args);

        incrementCallCount.call(this);
        this.thisValues.push(thisValue);
        this.args.push(args);
        this.callIds.push(callId++);

        // Make call properties available from within the spied function:
        createCallProperties.call(this);
        let exception;
        let returnValue;
        try {
            this.invoking = true;

            if (matching) {
                returnValue = matching.invoke(func, thisValue, args);
            } else {
                returnValue = (this.func || func).apply(thisValue, args);
            }

            const thisCall = this.getCall(this.callCount - 1);
            if (thisCall.calledWithNew() && !is.object(returnValue)) {
                returnValue = thisValue;
            }
        } catch (e) {
            exception = e;
        } finally {
            delete this.invoking;
        }

        this.exceptions.push(exception);
        this.returnValues.push(returnValue);
        const err = new ErrorConstructor();
        // 1. Please do not get stack at this point. It's may be so very slow, and not actually used
        // 2. PhantomJS does not serialize the stack trace until the error has been thrown:
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error/Stack
        try {
            throw err;
        } catch (e) { /* empty */ }
        this.errorsWithCallStack.push(err);

        // Make return value and exception available in the calls:
        createCallProperties.call(this);

        const call = this.getCall(this.callCount - 1);
        for (let i = 0; i < this.callAwaiters.length; ++i) {
            const awaiter = this.callAwaiters[i];
            if (awaiter.match(call)) {
                awaiter.resolve(call);
                this.callAwaiters.splice(i--, 1);
            }
        }

        if (!is.undefined(exception)) {
            throw exception;
        }

        return returnValue;
    },
    waitFor(match, ret = adone.identity) {
        return new Promise((resolve) => {
            this.callAwaiters.push({
                match,
                resolve: (call) => resolve(ret(call))
            });
        });
    },
    waitForCall() {
        return this.waitFor(adone.truly);
    },
    waitForNCalls(n) {
        const calls = [];
        return this.waitFor((call) => {
            calls.push(call);
            return calls.length === n;
        }, () => calls);
    },
    waitForArg(index, value) {
        return this.waitFor((call) => deepEqual(call.args[index], value));
    },
    waitForArgs(...args) {
        return this.waitFor((call) => {
            for (let i = 0; i < args.length; ++i) {
                if (!deepEqual(args[i], call.args[i])) {
                    return false;
                }
            }
            return true;
        });
    },
    named(name) {
        this.displayName = name;
        return this;
    },
    getCall(i) {
        if (i < 0 || i >= this.callCount) {
            return null;
        }

        return new SpyCall(
            this,
            this.thisValues[i],
            this.args[i],
            this.returnValues[i],
            this.exceptions[i],
            this.callIds[i],
            this.errorsWithCallStack[i]
        );
    },
    getCalls() {
        const calls = [];
        let i;

        for (i = 0; i < this.callCount; i++) {
            calls.push(this.getCall(i));
        }

        return calls;
    },
    calledBefore(spyFn) {
        if (!this.called) {
            return false;
        }

        if (!spyFn.called) {
            return true;
        }

        return this.callIds[0] < spyFn.callIds[spyFn.callIds.length - 1];
    },
    calledAfter(spyFn) {
        if (!this.called || !spyFn.called) {
            return false;
        }

        return this.callIds[this.callCount - 1] > spyFn.callIds[0];
    },
    calledImmediatelyBefore(spyFn) {
        if (!this.called || !spyFn.called) {
            return false;
        }

        return this.callIds[this.callCount - 1] === spyFn.callIds[spyFn.callCount - 1] - 1;
    },
    calledImmediatelyAfter(spyFn) {
        if (!this.called || !spyFn.called) {
            return false;
        }

        return this.callIds[this.callCount - 1] === spyFn.callIds[spyFn.callCount - 1] + 1;
    },
    withArgs(...args) {
        if (this.fakes) {
            const match = matchingFake(this.fakes, args, true);

            if (match) {
                return match;
            }
        } else {
            this.fakes = [];
        }

        const original = this;
        const fake = this.instantiateFake();
        fake.matchingArguments = args;
        fake.parent = this;
        this.fakes.push(fake);

        fake.withArgs = function (...args) {
            return original.withArgs(...args);
        };

        original.args.forEach((arg, i) => {
            if (!fake.matches(arg)) {
                return;
            }

            incrementCallCount.call(fake);
            fake.thisValues.push(original.thisValues[i]);
            fake.args.push(arg);
            fake.returnValues.push(original.returnValues[i]);
            fake.exceptions.push(original.exceptions[i]);
            fake.callIds.push(original.callIds[i]);
        });

        createCallProperties.call(fake);

        return fake;
    },
    matches(args, strict) {
        const margs = this.matchingArguments;

        if (margs.length <= args.length &&
            deepEqual(margs, args.slice(0, margs.length))) {
            return !strict || margs.length === args.length;
        }

        return undefined;
    },
    printf(format, ...args) {
        const spyInstance = this;
        let formatter;

        return (format || "").replace(/%(.)/g, (match, specifyer) => {
            formatter = proto.formatters[specifyer];

            if (is.function(formatter)) {
                return formatter(spyInstance, args);
            } else if (!is.nan(parseInt(specifyer, 10))) {
                return sformat(args[specifyer - 1]);
            }

            return `%${specifyer}`;
        });
    }
};

const delegateToCalls = (method, matchAny, actual, notCalled) => {
    proto[method] = function (...args) {
        if (!this.called) {
            if (notCalled) {
                return notCalled.apply(this, args);
            }
            return false;
        }

        let currentCall;
        let matches = 0;

        for (let i = 0, l = this.callCount; i < l; i += 1) {
            currentCall = this.getCall(i);

            if (currentCall[actual || method].apply(currentCall, args)) {
                matches += 1;

                if (matchAny) {
                    return true;
                }
            }
        }

        return matches === this.callCount;
    };
};

delegateToCalls("calledOn", true);
delegateToCalls("alwaysCalledOn", false, "calledOn");
delegateToCalls("calledWith", true);
delegateToCalls("calledWithMatch", true);
delegateToCalls("alwaysCalledWith", false, "calledWith");
delegateToCalls("alwaysCalledWithMatch", false, "calledWithMatch");
delegateToCalls("calledWithExactly", true);
delegateToCalls("alwaysCalledWithExactly", false, "calledWithExactly");
delegateToCalls("neverCalledWith", false, "notCalledWith", adone.truly);
delegateToCalls("neverCalledWithMatch", false, "notCalledWithMatch", adone.truly);
delegateToCalls("threw", true);
delegateToCalls("alwaysThrew", false, "threw");
delegateToCalls("returned", true);
delegateToCalls("alwaysReturned", false, "returned");
delegateToCalls("calledWithNew", true);
delegateToCalls("alwaysCalledWithNew", false, "calledWithNew");
delegateToCalls("callArg", false, "callArgWith", function () {
    throw new x.IllegalState(`${this.toString()} cannot call arg since it was not yet invoked.`);
});
proto.callArgWith = proto.callArg;
delegateToCalls("callArgOn", false, "callArgOnWith", function () {
    throw new x.IllegalState(`${this.toString()} cannot call arg since it was not yet invoked.`);
});
proto.callArgOnWith = proto.callArgOn;
delegateToCalls("throwArg", false, "throwArg", function () {
    throw new x.IllegalState(`${this.toString()} cannot throw arg since it was not yet invoked.`);
});
delegateToCalls("yield", false, "yield", function () {
    throw new x.IllegalState(`${this.toString()} cannot yield since it was not yet invoked.`);
});
// "invokeCallback" is an alias for "yield" since "yield" is invalid in strict mode.
proto.invokeCallback = proto.yield;
delegateToCalls("yieldOn", false, "yieldOn", function () {
    throw new x.IllegalState(`${this.toString()} cannot yield since it was not yet invoked.`);
});
delegateToCalls("yieldTo", false, "yieldTo", function (property) {
    throw new x.IllegalState(`${this.toString()} cannot yield to '${valueToString(property)}' since it was not yet invoked.`);
});
delegateToCalls("yieldToOn", false, "yieldToOn", function (property) {
    throw new x.IllegalState(`${this.toString()} cannot yield to '${valueToString(property)}' since it was not yet invoked.`);
});

export default function spy(object, property, types) {
    if (!property && is.function(object)) {
        return spy.create(object);
    }

    if (!object && !property) {
        return spy.create(() => { });
    }

    if (!types) {
        return wrapMethod(object, property, spy.create(object[property]));
    }

    const descriptor = {};
    const methodDesc = getPropertyDescriptor(object, property);

    types.forEach((type) => {
        descriptor[type] = spy.create(methodDesc[type]);
    });

    return wrapMethod(object, property, descriptor);
}

Object.assign(spy, proto);
spy.SpyCall = SpyCall;
