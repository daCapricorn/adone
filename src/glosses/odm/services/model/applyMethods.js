const {
    is
} = adone;

/*!
 * Register methods for this model
 *
 * @param {Model} model
 * @param {Schema} schema
 */

module.exports = function applyMethods(model, schema) {
    function apply(method, schema) {
        Object.defineProperty(model.prototype, method, {
            get() {
                let h = {};
                for (let k in schema.methods[method]) {
                    h[k] = schema.methods[method][k].bind(this);
                }
                return h;
            },
            configurable: true
        });
    }
    for (const method in schema.methods) {
        if (schema.tree.hasOwnProperty(method)) {
            throw new Error(`${"You have a method and a property in your schema both " +'named "'}${  method  }"`);
        }
        if (is.function(schema.methods[method])) {
            model.prototype[method] = schema.methods[method];
        } else {
            apply(method, schema);
        }
    }

    // Recursively call `applyMethods()` on child schemas
    model.$appliedMethods = true;
    for (let i = 0; i < schema.childSchemas.length; ++i) {
        if (schema.childSchemas[i].model.$appliedMethods) {
            continue;
        }
        applyMethods(schema.childSchemas[i].model, schema.childSchemas[i].schema);
    }
};
