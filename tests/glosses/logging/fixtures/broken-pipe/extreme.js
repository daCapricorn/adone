

global.process = { __proto__: process, pid: 123456 };
Date.now = function () {
    return 1459875739796; 
};
require("os").hostname = function () {
    return "abcdefghijklmnopqr"; 
};

const pino = require("../../..");
const logger = pino(pino.extreme());

for (let i = 0; i < 1000; i++) {
    logger.info("hello world");
}