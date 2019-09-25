/**
 * eslint-env mocha
 */


const chai = require("chai");
const dirtyChai = require("dirty-chai");
const expect = chai.expect;
chai.use(dirtyChai);

const Switch = require("../../src/switch");

describe("create Switch instance", () => {
    it("throws on missing peerInfo", () => {
        expect(() => new Switch()).to.throw(/You must provide a `peerInfo`/);
    });
});
