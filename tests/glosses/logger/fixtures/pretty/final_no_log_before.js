require("adone");
global.process = { __proto__: process, pid: 123456 };
Date.now = function () {
    return 1459875739796; 
};
require("os").hostname = function () {
    return "abcdefghijklmnopqr"; 
};

const log = adone.logger({ prettyPrint: true });
process.once("beforeExit", adone.logger.final(log, (_, logger) => {
    logger.info("beforeExit");
}));