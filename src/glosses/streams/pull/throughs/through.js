//a pass through stream that doesn't change the value.
export default function through(op, onEnd) {
    let a = false;

    const once = (abort) => {
        if (a || !onEnd) {
            return;

        }
        a = true;
        onEnd(abort === true ? null : abort);
    };

    return function (read) {
        return function (end, cb) {
            if (end) {
                once(end);
            }
            return read(end, (end, data) => {
                if (!end) {
                    op && op(data);

                } else {
                    once(end);

                }
                cb(end, data);
            });
        };
    };
}