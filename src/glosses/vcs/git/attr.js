const native = adone.bind("git.node");

const Attr = native.Attr;

Attr.STATES = {
    UNSPECIFIED_T: 0,
    TRUE_T: 1,
    FALSE_T: 2,
    VALUE_T: 3
};

Attr.get = adone.promise.promisifyAll(native.Attr.get);

export default Attr;

