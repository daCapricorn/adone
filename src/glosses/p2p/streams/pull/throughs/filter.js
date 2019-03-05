

const tester = require("../util/tester");

module.exports = function filter(test) {
    //regexp
    test = tester(test);
    return function (read) {
        return function next(end, cb) {
            let sync; let loop = true;
            while (loop) {
                loop = false;
                sync = true;
                read(end, (end, data) => {
                    if (!end && !test(data)) {
                        return sync ? loop = true : next(end, cb); 
                    }
                    cb(end, data);
                });
                sync = false;
            }
        };
    };
};

