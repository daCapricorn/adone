module.exports = {
        skip: true,
	description: 'supports es6-shim',
	options: {
		onwarn(warning) {
			if (warning.code !== 'THIS_IS_UNDEFINED') {
				throw new Error(warning.message);
			}
		},
		// check against tree-shake: false when updating the shim
		treeshake: true,
		plugins: [adone.rollup.plugin.resolve(), adone.rollup.plugin.commonjs()]
	}
};
