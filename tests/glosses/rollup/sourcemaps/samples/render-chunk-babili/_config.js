const babiliResults = require('./babili-results');
const getLocation = require('../../getLocation');
const {
	sourcemap: { SourceMapConsumer }
} = adone;

module.exports = {
	description: 'generates valid sourcemap when source could not be determined',
	options: {
		plugins: [
			{
				renderChunk(code, chunk, options) {
					const format = options.format;

					return babiliResults[format];
				}
			}
		],
		output: { indent: false }
	},
	test(code, map) {
		const smc = new SourceMapConsumer(map);

		let generatedLoc = getLocation(code, code.indexOf('42'));
		let originalLoc = smc.originalPositionFor(generatedLoc);

		assert.ok(/main/.test(originalLoc.source));
		assert.equal(originalLoc.line, 1);
		assert.equal(originalLoc.column, 13);

		generatedLoc = getLocation(code, code.indexOf('log'));
		originalLoc = smc.originalPositionFor(generatedLoc);

		assert.equal(originalLoc.line, 1);
		assert.equal(originalLoc.column, 8);
	}
};