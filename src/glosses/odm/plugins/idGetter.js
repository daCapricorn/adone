const {
    is
} = adone;

module.exports = function (schema) {
    // ensure the documents receive an id getter unless disabled
    const autoIdGetter = !schema.paths.id &&
        (!schema.options.noVirtualId && schema.options.id);
    if (autoIdGetter) {
        schema.virtual("id").get(idGetter);
    }
};

/*!
 * Returns this documents _id cast to a string.
 */

function idGetter() {
    if (!is.nil(this._id)) {
        return String(this._id);
    }

    return null;
}
