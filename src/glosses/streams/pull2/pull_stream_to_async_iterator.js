const {
    stream: { pull2: pull }
} = adone;

module.exports = (source) => {
    return (async function* () {
        let _read;

        const sink = (read) => {
            _read = () => new Promise((resolve, reject) => {
                read(null, (end, data) => {
                    if (end === true) {
                        return resolve({ end });
                    }
                    if (end) {
                        return reject(end);
                    }
                    resolve({ data });
                });
            });
        };

        pull(source, sink);

        while (true) {
            const { end, data } = await _read();
            if (end) {
                break;
            }
            yield data;
        }
    })();
};