const {
    is
} = adone;

const rawPipe = (...fns) => {
    let res;
    // console.log(adone.inspect(fns));
    while (fns.length) {
        const v = fns.shift();
        // console.log(adone.inspect(v));
        res = v(res);
    }
    return res;
};

const isIterable = (obj) => obj && (
    is.function(obj[Symbol.asyncIterator]) ||
    is.function(obj[Symbol.iterator]) ||
    is.function(obj.next) // Probably, right?
);

const isDuplex = (obj) => obj && is.function(obj.sink) && isIterable(obj.source);

const duplexPipelineFn = (duplex) => (source) => {
    duplex.sink(source); // TODO: error on sink side is unhandled rejection - this is the same as pull streams
    return duplex.source;
};

const pipe = (...fns) => {
    // Duplex at start: wrap in function and return duplex source
    if (isDuplex(fns[0])) {
        const duplex = fns[0];
        fns[0] = () => duplex.source;
        // Iterable at start: wrap in function
    } else if (isIterable(fns[0])) {
        const source = fns[0];
        fns[0] = () => source;
    }

    if (fns.length > 1) {
        // Duplex at end: use duplex sink
        if (isDuplex(fns[fns.length - 1])) {
            fns[fns.length - 1] = fns[fns.length - 1].sink;
        }
    }

    if (fns.length > 2) {
        // Duplex in the middle, consume source with duplex sink and return duplex source
        for (let i = 1; i < fns.length - 1; i++) {
            if (isDuplex(fns[i])) {
                fns[i] = duplexPipelineFn(fns[i]);
            }
        }
    }

    return rawPipe(...fns);
};

module.exports = pipe;
module.exports.pipe = pipe;
module.exports.rawPipe = rawPipe;
module.exports.isIterable = isIterable;
module.exports.isDuplex = isDuplex;
