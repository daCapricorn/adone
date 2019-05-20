const {
    is,
    text: { MagicString }
} = adone;

class IntegrityCheckingMagicString extends MagicString {
    checkIntegrity() {
        let prevChunk = null;
        let chunk = this.firstChunk;
        let numNodes = 0;
        while (chunk) {
            assert.strictEqual(this.byStart[chunk.start], chunk);
            assert.strictEqual(this.byEnd[chunk.end], chunk);
            assert.strictEqual(chunk.previous, prevChunk);
            if (prevChunk) {
                assert.strictEqual(prevChunk.next, chunk);
            }
            prevChunk = chunk;
            chunk = chunk.next;
            numNodes++;
        }
        assert.strictEqual(prevChunk, this.lastChunk);
        assert.strictEqual(this.lastChunk.next, null);
        assert.strictEqual(Object.keys(this.byStart).length, numNodes);
        assert.strictEqual(Object.keys(this.byEnd).length, numNodes);
    }
}

for (const key in MagicString.prototype) {
    if (!MagicString.prototype.hasOwnProperty(key)) {
        continue;
    }
    const func = MagicString.prototype[key];
    if (is.function(func)) {
        IntegrityCheckingMagicString.prototype[key] = function () {
            const result = func.apply(this, arguments);
            try {
                this.checkIntegrity();
            } catch (e) {
                e.message = `Integrity error after invoking ${key}:\n${e.message}`;
                throw e;
            }
            return result;
        };
    }
}

module.exports = IntegrityCheckingMagicString;
