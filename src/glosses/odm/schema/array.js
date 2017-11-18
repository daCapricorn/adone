const $exists = require("./operators/exists");
const $type = require("./operators/type");
const SchemaType = require("../schematype");
const CastError = SchemaType.CastError;
const Types = {
    Array: SchemaArray,
    Boolean: require("./boolean"),
    Date: require("./date"),
    Number: require("./number"),
    String: require("./string"),
    ObjectId: require("./objectid"),
    Buffer: require("./buffer")
};
const MongooseArray = require("../types").Array;
const EmbeddedDoc = require("../types").Embedded;
const Mixed = require("./mixed");
const cast = require("../cast");
const util = require("util");
const utils = require("../utils");
const castToNumber = require("./operators/helpers").castToNumber;
const geospatial = require("./operators/geospatial");

const {
    is
} = adone;

/**
 * Array SchemaType constructor
 *
 * @param {String} key
 * @param {SchemaType} cast
 * @param {Object} options
 * @inherits SchemaType
 * @api public
 */

function SchemaArray(key, cast, options, schemaOptions) {
    let typeKey = "type";
    if (schemaOptions && schemaOptions.typeKey) {
        typeKey = schemaOptions.typeKey;
    }

    if (cast) {
        let castOptions = {};

        if (utils.getFunctionName(cast.constructor) === "Object") {
            if (cast[typeKey]) {
                // support { type: Woot }
                castOptions = utils.clone(cast); // do not alter user arguments
                delete castOptions[typeKey];
                cast = cast[typeKey];
            } else {
                cast = Mixed;
            }
        }

        // support { type: 'String' }
        const name = is.string(cast)
            ? cast
            : utils.getFunctionName(cast);

        const caster = name in Types
            ? Types[name]
            : cast;

        this.casterConstructor = caster;
        if (is.function(caster) && !caster.$isArraySubdocument) {
            this.caster = new caster(null, castOptions);
        } else {
            this.caster = caster;
        }

        if (!(this.caster instanceof EmbeddedDoc)) {
            this.caster.path = key;
        }
    }

    this.$isMongooseArray = true;

    SchemaType.call(this, key, options, "Array");

    let defaultArr;
    let fn;

    if (!is.nil(this.defaultValue)) {
        defaultArr = this.defaultValue;
        fn = is.function(defaultArr);
    }

    if (!("defaultValue" in this) || this.defaultValue !== void 0) {
        this.default(() => {
            let arr = [];
            if (fn) {
                arr = defaultArr();
            } else if (!is.nil(defaultArr)) {
                arr = arr.concat(defaultArr);
            }
            // Leave it up to `cast()` to convert the array
            return arr;
        });
    }
}

/**
 * This schema type's name, to defend against minifiers that mangle
 * function names.
 *
 * @api public
 */
SchemaArray.schemaName = "Array";

/*!
 * Inherits from SchemaType.
 */
SchemaArray.prototype = Object.create(SchemaType.prototype);
SchemaArray.prototype.constructor = SchemaArray;

/**
 * Check if the given value satisfies a required validator. The given value
 * must be not null nor undefined, and have a positive length.
 *
 * @param {Any} value
 * @return {Boolean}
 * @api public
 */

SchemaArray.prototype.checkRequired = function (value) {
    return Boolean(value && value.length);
};

/**
 * Overrides the getters application for the population special-case
 *
 * @param {Object} value
 * @param {Object} scope
 * @api private
 */

SchemaArray.prototype.applyGetters = function (value, scope) {
    if (this.caster.options && this.caster.options.ref) {
        // means the object id was populated
        return value;
    }

    return SchemaType.prototype.applyGetters.call(this, value, scope);
};

/**
 * Casts values for set().
 *
 * @param {Object} value
 * @param {Document} doc document that triggers the casting
 * @param {Boolean} init whether this is an initialization cast
 * @api private
 */

SchemaArray.prototype.cast = function (value, doc, init) {
    if (is.array(value)) {
        if (!value.length && doc) {
            const indexes = doc.schema.indexedPaths();

            for (var i = 0, l = indexes.length; i < l; ++i) {
                const pathIndex = indexes[i][0][this.path];
                if (pathIndex === "2dsphere" || pathIndex === "2d") {
                    return;
                }
            }
        }

        if (!(value && value.isMongooseArray)) {
            value = new MongooseArray(value, this.path, doc);
        } else if (value && value.isMongooseArray) {
            // We need to create a new array, otherwise change tracking will
            // update the old doc (gh-4449)
            value = new MongooseArray(value, this.path, doc);
        }

        if (this.caster) {
            try {
                for (i = 0, l = value.length; i < l; i++) {
                    value[i] = this.caster.cast(value[i], doc, init);
                }
            } catch (e) {
                // rethrow
                throw new CastError(`[${e.kind}]`, util.inspect(value), this.path, e);
            }
        }

        return value;
    }
    // gh-2442: if we're loading this from the db and its not an array, mark
    // the whole array as modified.
    if (Boolean(doc) && Boolean(init)) {
        doc.markModified(this.path);
    }
    return this.cast([value], doc, init);
};

/**
 * Casts values for queries.
 *
 * @param {String} $conditional
 * @param {any} [value]
 * @api private
 */

SchemaArray.prototype.castForQuery = function ($conditional, value) {
    let handler,
        val;

    if (arguments.length === 2) {
        handler = this.$conditionalHandlers[$conditional];

        if (!handler) {
            throw new Error(`Can't use ${$conditional} with Array.`);
        }

        val = handler.call(this, value);
    } else {
        val = $conditional;
        let Constructor = this.casterConstructor;

        if (val &&
            Constructor.discriminators &&
            Constructor.schema.options.discriminatorKey &&
            is.string(val[Constructor.schema.options.discriminatorKey]) &&
            Constructor.discriminators[val[Constructor.schema.options.discriminatorKey]]) {
            Constructor = Constructor.discriminators[val[Constructor.schema.options.discriminatorKey]];
        }

        const proto = this.casterConstructor.prototype;
        let method = proto && (proto.castForQuery || proto.cast);
        if (!method && Constructor.castForQuery) {
            method = Constructor.castForQuery;
        }
        const caster = this.caster;

        if (is.array(val)) {
            val = val.map((v) => {
                if (utils.isObject(v) && v.$elemMatch) {
                    return v;
                }
                if (method) {
                    v = method.call(caster, v);
                    return v;
                }
                if (!is.nil(v)) {
                    v = new Constructor(v);
                    return v;
                }
                return v;
            });
        } else if (method) {
            val = method.call(caster, val);
        } else if (!is.nil(val)) {
            val = new Constructor(val);
        }
    }

    return val;
};

function cast$all(val) {
    if (!is.array(val)) {
        val = [val];
    }

    val = val.map(function (v) {
        if (utils.isObject(v)) {
            const o = {};
            o[this.path] = v;
            return cast(this.casterConstructor.schema, o)[this.path];
        }
        return v;
    }, this);

    return this.castForQuery(val);
}

function cast$elemMatch(val) {
    const keys = Object.keys(val);
    const numKeys = keys.length;
    let key;
    let value;
    for (let i = 0; i < numKeys; ++i) {
        key = keys[i];
        value = val[key];
        if (key.indexOf("$") === 0 && value) {
            val[key] = this.castForQuery(key, value);
        }
    }

    return cast(this.casterConstructor.schema, val);
}

const handle = SchemaArray.prototype.$conditionalHandlers = {};

handle.$all = cast$all;
handle.$options = String;
handle.$elemMatch = cast$elemMatch;
handle.$geoIntersects = geospatial.cast$geoIntersects;
handle.$or = handle.$and = function (val) {
    if (!is.array(val)) {
        throw new TypeError("conditional $or/$and require array");
    }

    const ret = [];
    for (let i = 0; i < val.length; ++i) {
        ret.push(cast(this.casterConstructor.schema, val[i]));
    }

    return ret;
};

handle.$near =
    handle.$nearSphere = geospatial.cast$near;

handle.$within =
    handle.$geoWithin = geospatial.cast$within;

handle.$size =
    handle.$minDistance =
    handle.$maxDistance = castToNumber;

handle.$exists = $exists;
handle.$type = $type;

handle.$eq =
    handle.$gt =
    handle.$gte =
    handle.$in =
    handle.$lt =
    handle.$lte =
    handle.$ne =
    handle.$nin =
    handle.$regex = SchemaArray.prototype.castForQuery;

/*!
 * Module exports.
 */

module.exports = SchemaArray;
