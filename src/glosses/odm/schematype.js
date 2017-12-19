const $exists = require("./schema/operators/exists");
const $type = require("./schema/operators/type");
const utils = require("./utils");
const MongooseError = require("./error");
const CastError = MongooseError.CastError;
const ValidatorError = MongooseError.ValidatorError;


const {
    is
} = adone;

/*!
 * Handle async validators
 */
const asyncValidate = function (validator, scope, value, props, cb) {
    let called = false;
    let returnVal;
    returnVal = validator.call(scope, value, (ok, customMsg) => {
        if (called) {
            return;
        }
        called = true;
        if (is.boolean(returnVal)) {
            return;
        }
        if (customMsg) {
            props.message = customMsg;
        }
        cb(ok, props);
    });
    if (is.boolean(returnVal)) {
        called = true;
        return cb(returnVal, props);
    } else if (returnVal && is.function(returnVal.then)) {
        // Promise
        returnVal.then(
            (ok) => {
                if (called) {
                    return;
                }
                called = true;
                cb(ok, props);
            },
            (error) => {
                if (called) {
                    return;
                }
                called = true;

                props.reason = error;
                cb(false, props);
            });
    }
};

const legacyAsyncValidate = require("util").deprecate(asyncValidate,
    "Implicit async custom validators (custom validators that take 2 " +
    "arguments) are deprecated in mongoose >= 4.9.0. See " +
    "http://mongoosejs.com/docs/validation.html#async-custom-validators for " +
    "more info.");


const handleSingle = function (val) {
    return this.castForQuery(val);
};

const handleArray = function (val) {
    const _this = this;
    if (!is.array(val)) {
        return [this.castForQuery(val)];
    }
    return val.map((m) => {
        return _this.castForQuery(m);
    });
};

/**
 * SchemaType constructor
 *
 * @param {String} path
 * @param {Object} [options]
 * @param {String} [instance]
 * @api public
 */
export default class SchemaType {
    constructor(path, options, instance, postCtr = true) {
        this.path = path;
        this.instance = instance;
        this.validators = [];
        this.setters = [];
        this.getters = [];
        this.options = options;
        this._index = null;
        this.selected;

        if (postCtr) {
            this.postConstruct();
        }

        Object.defineProperty(this, "$$context", {
            enumerable: false,
            configurable: false,
            writable: true,
            value: null
        });
    }

    postConstruct() {
        for (const prop in this.options) {
            if (this[prop] && is.function(this[prop])) {
                // { unique: true, index: true }
                if (prop === "index" && this._index) {
                    continue;
                }

                const val = this.options[prop];
                // Special case so we don't screw up array defaults, see gh-5780
                if (prop === "default") {
                    this.default(val);
                    continue;
                }

                this[prop].apply(this, adone.util.arrify(val));
            }
        }
    }

    /**
     * Sets a default value for this SchemaType.
     *
     * ####Example:
     *
     *     var schema = new Schema({ n: { type: Number, default: 10 })
     *     var M = db.model('M', schema)
     *     var m = new M;
     *     console.log(m.n) // 10
     *
     * Defaults can be either `functions` which return the value to use as the default or the literal value itself. Either way, the value will be cast based on its schema type before being set during document creation.
     *
     * ####Example:
     *
     *     // values are cast:
     *     var schema = new Schema({ aNumber: { type: Number, default: 4.815162342 }})
     *     var M = db.model('M', schema)
     *     var m = new M;
     *     console.log(m.aNumber) // 4.815162342
     *
     *     // default unique objects for Mixed types:
     *     var schema = new Schema({ mixed: Schema.Types.Mixed });
     *     schema.path('mixed').default(function () {
     *       return {};
     *     });
     *
     *     // if we don't use a function to return object literals for Mixed defaults,
     *     // each document will receive a reference to the same object literal creating
     *     // a "shared" object instance:
     *     var schema = new Schema({ mixed: Schema.Types.Mixed });
     *     schema.path('mixed').default({});
     *     var M = db.model('M', schema);
     *     var m1 = new M;
     *     m1.mixed.added = 1;
     *     console.log(m1.mixed); // { added: 1 }
     *     var m2 = new M;
     *     console.log(m2.mixed); // { added: 1 }
     *
     * @param {Function|any} val the default value
     * @return {defaultValue}
     * @api public
     */
    default(val) {
        if (arguments.length === 1) {
            if (val === void 0) {
                this.defaultValue = void 0;
                return void 0;
            }
            this.defaultValue = val;
            return this.defaultValue;
        } else if (arguments.length > 1) {
            this.defaultValue = utils.args(arguments);
        }
        return this.defaultValue;
    }

    /**
     * Declares the index options for this schematype.
     *
     * ####Example:
     *
     *     var s = new Schema({ name: { type: String, index: true })
     *     var s = new Schema({ loc: { type: [Number], index: 'hashed' })
     *     var s = new Schema({ loc: { type: [Number], index: '2d', sparse: true })
     *     var s = new Schema({ loc: { type: [Number], index: { type: '2dsphere', sparse: true }})
     *     var s = new Schema({ date: { type: Date, index: { unique: true, expires: '1d' }})
     *     Schema.path('my.path').index(true);
     *     Schema.path('my.date').index({ expires: 60 });
     *     Schema.path('my.path').index({ unique: true, sparse: true });
     *
     * ####NOTE:
     *
     * _Indexes are created in the background by default. Specify `background: false` to override._
     *
     * [Direction doesn't matter for single key indexes](http://www.mongodb.org/display/DOCS/Indexes#Indexes-CompoundKeysIndexes)
     *
     * @param {Object|Boolean|String} options
     * @return {SchemaType} this
     * @api public
     */
    index(options) {
        this._index = options;
        utils.expires(this._index);
        return this;
    }

    /**
     * Declares an unique index.
     *
     * ####Example:
     *
     *     var s = new Schema({ name: { type: String, unique: true }});
     *     Schema.path('name').index({ unique: true });
     *
     * _NOTE: violating the constraint returns an `E11000` error from MongoDB when saving, not a Mongoose validation error._
     *
     * @param {Boolean} bool
     * @return {SchemaType} this
     * @api public
     */
    unique(bool) {
        if (this._index === false) {
            if (!bool) {
                return;
            }
            throw new Error(`Path "${this.path}" may not have \`index\` set to ` +
                "false and `unique` set to true");
        }
        if (is.nil(this._index) || this._index === true) {
            this._index = {};
        } else if (is.string(this._index)) {
            this._index = { type: this._index };
        }

        this._index.unique = bool;
        return this;
    }

    /**
     * Declares a full text index.
     *
     * ###Example:
     *
     *      var s = new Schema({name : {type: String, text : true })
     *      Schema.path('name').index({text : true});
     * @param {Boolean} bool
     * @return {SchemaType} this
     * @api public
     */
    text(bool) {
        if (is.null(this._index) || is.undefined(this._index) ||
            is.boolean(this._index)) {
            this._index = {};
        } else if (is.string(this._index)) {
            this._index = { type: this._index };
        }

        this._index.text = bool;
        return this;
    }

    /**
     * Declares a sparse index.
     *
     * ####Example:
     *
     *     var s = new Schema({ name: { type: String, sparse: true })
     *     Schema.path('name').index({ sparse: true });
     *
     * @param {Boolean} bool
     * @return {SchemaType} this
     * @api public
     */
    sparse(bool) {
        if (is.null(this._index) || is.undefined(this._index) ||
            is.boolean(this._index)) {
            this._index = {};
        } else if (is.string(this._index)) {
            this._index = { type: this._index };
        }

        this._index.sparse = bool;
        return this;
    }

    /**
     * Adds a setter to this schematype.
     *
     * ####Example:
     *
     *     function capitalize (val) {
     *       if (typeof val !== 'string') val = '';
     *       return val.charAt(0).toUpperCase() + val.substring(1);
     *     }
     *
     *     // defining within the schema
     *     var s = new Schema({ name: { type: String, set: capitalize }})
     *
     *     // or by retreiving its SchemaType
     *     var s = new Schema({ name: String })
     *     s.path('name').set(capitalize)
     *
     * Setters allow you to transform the data before it gets to the raw mongodb document and is set as a value on an actual key.
     *
     * Suppose you are implementing user registration for a website. Users provide an email and password, which gets saved to mongodb. The email is a string that you will want to normalize to lower case, in order to avoid one email having more than one account -- e.g., otherwise, avenue@q.com can be registered for 2 accounts via avenue@q.com and AvEnUe@Q.CoM.
     *
     * You can set up email lower case normalization easily via a Mongoose setter.
     *
     *     function toLower(v) {
     *       return v.toLowerCase();
     *     }
     *
     *     var UserSchema = new Schema({
     *       email: { type: String, set: toLower }
     *     });
     *
     *     var User = db.model('User', UserSchema);
     *
     *     var user = new User({email: 'AVENUE@Q.COM'});
     *     console.log(user.email); // 'avenue@q.com'
     *
     *     // or
     *     var user = new User();
     *     user.email = 'Avenue@Q.com';
     *     console.log(user.email); // 'avenue@q.com'
     *
     * As you can see above, setters allow you to transform the data before it stored in MongoDB.
     *
     * NOTE: setters by default do **not** run on queries by default.
     *
     *     // Will **not** run the `toLower()` setter by default.
     *     User.updateOne({ _id: _id }, { $set: { email: 'AVENUE@Q.COM' } });
     *
     * Use the `runSettersOnQuery` option to opt-in to running setters on `User.update()`:
     *
     *     // Turn on `runSettersOnQuery` to run the setters from your schema.
     *     User.updateOne({ _id: _id }, { $set: { email: 'AVENUE@Q.COM' } }, {
     *       runSettersOnQuery: true
     *     });
     *
     * _NOTE: we could have also just used the built-in `lowercase: true` SchemaType option instead of defining our own function._
     *
     *     new Schema({ email: { type: String, lowercase: true }})
     *
     * Setters are also passed a second argument, the schematype on which the setter was defined. This allows for tailored behavior based on options passed in the schema.
     *
     *     function inspector (val, schematype) {
     *       if (schematype.options.required) {
     *         return schematype.path + ' is required';
     *       } else {
     *         return val;
     *       }
     *     }
     *
     *     var VirusSchema = new Schema({
     *       name: { type: String, required: true, set: inspector },
     *       taxonomy: { type: String, set: inspector }
     *     })
     *
     *     var Virus = db.model('Virus', VirusSchema);
     *     var v = new Virus({ name: 'Parvoviridae', taxonomy: 'Parvovirinae' });
     *
     *     console.log(v.name);     // name is required
     *     console.log(v.taxonomy); // Parvovirinae
     *
     * @param {Function} fn
     * @return {SchemaType} this
     * @api public
     */
    set(fn) {
        if (!is.function(fn)) {
            throw new TypeError("A setter must be a function.");
        }
        this.setters.push(fn);
        return this;
    }

    /**
     * Adds a getter to this schematype.
     *
     * ####Example:
     *
     *     function dob (val) {
     *       if (!val) return val;
     *       return (val.getMonth() + 1) + "/" + val.getDate() + "/" + val.getFullYear();
     *     }
     *
     *     // defining within the schema
     *     var s = new Schema({ born: { type: Date, get: dob })
     *
     *     // or by retreiving its SchemaType
     *     var s = new Schema({ born: Date })
     *     s.path('born').get(dob)
     *
     * Getters allow you to transform the representation of the data as it travels from the raw mongodb document to the value that you see.
     *
     * Suppose you are storing credit card numbers and you want to hide everything except the last 4 digits to the mongoose user. You can do so by defining a getter in the following way:
     *
     *     function obfuscate (cc) {
     *       return '****-****-****-' + cc.slice(cc.length-4, cc.length);
     *     }
     *
     *     var AccountSchema = new Schema({
     *       creditCardNumber: { type: String, get: obfuscate }
     *     });
     *
     *     var Account = db.model('Account', AccountSchema);
     *
     *     Account.findById(id, function (err, found) {
     *       console.log(found.creditCardNumber); // '****-****-****-1234'
     *     });
     *
     * Getters are also passed a second argument, the schematype on which the getter was defined. This allows for tailored behavior based on options passed in the schema.
     *
     *     function inspector (val, schematype) {
     *       if (schematype.options.required) {
     *         return schematype.path + ' is required';
     *       } else {
     *         return schematype.path + ' is not';
     *       }
     *     }
     *
     *     var VirusSchema = new Schema({
     *       name: { type: String, required: true, get: inspector },
     *       taxonomy: { type: String, get: inspector }
     *     })
     *
     *     var Virus = db.model('Virus', VirusSchema);
     *
     *     Virus.findById(id, function (err, virus) {
     *       console.log(virus.name);     // name is required
     *       console.log(virus.taxonomy); // taxonomy is not
     *     })
     *
     * @param {Function} fn
     * @return {SchemaType} this
     * @api public
     */
    get(fn) {
        if (!is.function(fn)) {
            throw new TypeError("A getter must be a function.");
        }
        this.getters.push(fn);
        return this;
    }

    /**
     * Adds validator(s) for this document path.
     *
     * Validators always receive the value to validate as their first argument and must return `Boolean`. Returning `false` means validation failed.
     *
     * The error message argument is optional. If not passed, the [default generic error message template](#error_messages_MongooseError-messages) will be used.
     *
     * ####Examples:
     *
     *     // make sure every value is equal to "something"
     *     function validator (val) {
     *       return val == 'something';
     *     }
     *     new Schema({ name: { type: String, validate: validator }});
     *
     *     // with a custom error message
     *
     *     var custom = [validator, 'Uh oh, {PATH} does not equal "something".']
     *     new Schema({ name: { type: String, validate: custom }});
     *
     *     // adding many validators at a time
     *
     *     var many = [
     *         { validator: validator, msg: 'uh oh' }
     *       , { validator: anotherValidator, msg: 'failed' }
     *     ]
     *     new Schema({ name: { type: String, validate: many }});
     *
     *     // or utilizing SchemaType methods directly:
     *
     *     var schema = new Schema({ name: 'string' });
     *     schema.path('name').validate(validator, 'validation of `{PATH}` failed with value `{VALUE}`');
     *
     * ####Error message templates:
     *
     * From the examples above, you may have noticed that error messages support basic templating. There are a few other template keywords besides `{PATH}` and `{VALUE}` too. To find out more, details are available [here](#error_messages_MongooseError.messages)
     *
     * ####Asynchronous validation:
     *
     * Passing a validator function that receives two arguments tells mongoose that the validator is an asynchronous validator. The first argument passed to the validator function is the value being validated. The second argument is a callback function that must called when you finish validating the value and passed either `true` or `false` to communicate either success or failure respectively.
     *
     *     schema.path('name').validate({
     *       isAsync: true,
     *       validator: function (value, respond) {
     *         doStuff(value, function () {
     *           ...
     *           respond(false); // validation failed
     *         });
     *       },
     *       message: 'Custom error message!' // Optional
     *     });
     *
     *     // Can also return a promise
     *     schema.path('name').validate({
     *       validator: function (value) {
     *         return new Promise(function (resolve, reject) {
     *           resolve(false); // validation failed
     *         });
     *       }
     *     });
     *
     * You might use asynchronous validators to retreive other documents from the database to validate against or to meet other I/O bound validation needs.
     *
     * Validation occurs `pre('save')` or whenever you manually execute [document#validate](#document_Document-validate).
     *
     * If validation fails during `pre('save')` and no callback was passed to receive the error, an `error` event will be emitted on your Models associated db [connection](#connection_Connection), passing the validation error object along.
     *
     *     var conn = mongoose.createConnection(..);
     *     conn.on('error', handleError);
     *
     *     var Product = conn.model('Product', yourSchema);
     *     var dvd = new Product(..);
     *     dvd.save(); // emits error on the `conn` above
     *
     * If you desire handling these errors at the Model level, attach an `error` listener to your Model and the event will instead be emitted there.
     *
     *     // registering an error listener on the Model lets us handle errors more locally
     *     Product.on('error', handleError);
     *
     * @param {RegExp|Function|Object} obj validator
     * @param {String} [errorMsg] optional error message
     * @param {String} [type] optional validator type
     * @return {SchemaType} this
     * @api public
     */
    validate(obj, message, type) {
        if (is.function(obj) || obj && utils.getFunctionName(obj.constructor) === "RegExp") {
            let properties;
            if (message instanceof Object && !type) {
                properties = utils.clone(message);
                if (!properties.message) {
                    properties.message = properties.msg;
                }
                properties.validator = obj;
                properties.type = properties.type || "user defined";
            } else {
                if (!message) {
                    message = MongooseError.messages.general.default;
                }
                if (!type) {
                    type = "user defined";
                }
                properties = { message, type, validator: obj };
            }
            this.validators.push(properties);
            return this;
        }

        let i;
        let length;
        let arg;

        for (i = 0, length = arguments.length; i < length; i++) {
            arg = arguments[i];
            if (!(arg && utils.getFunctionName(arg.constructor) === "Object")) {
                const msg = `Invalid validator. Received (${typeof arg}) ${
                    arg
                }. See http://mongoosejs.com/docs/api.html#schematype_SchemaType-validate`;

                throw new Error(msg);
            }
            this.validate(arg.validator, arg);
        }

        return this;
    }

    /**
     * Adds a required validator to this SchemaType. The validator gets added
     * to the front of this SchemaType's validators array using `unshift()`.
     *
     * ####Example:
     *
     *     var s = new Schema({ born: { type: Date, required: true })
     *
     *     // or with custom error message
     *
     *     var s = new Schema({ born: { type: Date, required: '{PATH} is required!' })
     *
     *     // or with a function
     *
     *     var s = new Schema({
     *       userId: ObjectId,
     *       username: {
     *         type: String,
     *         required: function() { return this.userId != null; }
     *       }
     *     })
     *
     *     // or with a function and a custom message
     *     var s = new Schema({
     *       userId: ObjectId,
     *       username: {
     *         type: String,
     *         required: [
     *           function() { return this.userId != null; },
     *           'username is required if id is specified'
     *         ]
     *       }
     *     })
     *
     *     // or through the path API
     *
     *     Schema.path('name').required(true);
     *
     *     // with custom error messaging
     *
     *     Schema.path('name').required(true, 'grrr :( ');
     *
     *     // or make a path conditionally required based on a function
     *     var isOver18 = function() { return this.age >= 18; };
     *     Schema.path('voterRegistrationId').required(isOver18);
     *
     * The required validator uses the SchemaType's `checkRequired` function to
     * determine whether a given value satisfies the required validator. By default,
     * a value satisfies the required validator if `val != null` (that is, if
     * the value is not null nor undefined). However, most built-in mongoose schema
     * types override the default `checkRequired` function:
     *
     * @param {Boolean|Function|Object} required enable/disable the validator, or function that returns required boolean, or options object
     * @param {Boolean|Function} [options.isRequired] enable/disable the validator, or function that returns required boolean
     * @param {Function} [options.ErrorConstructor] custom error constructor. The constructor receives 1 parameter, an object containing the validator properties.
     * @param {String} [message] optional custom error message
     * @return {SchemaType} this
     * @see Customized Error Messages #error_messages_MongooseError-messages
     * @see SchemaArray#checkRequired #schema_array_SchemaArray.checkRequired
     * @see SchemaBoolean#checkRequired #schema_boolean_SchemaBoolean-checkRequired
     * @see SchemaBuffer#checkRequired #schema_buffer_SchemaBuffer.schemaName
     * @see SchemaNumber#checkRequired #schema_number_SchemaNumber-min
     * @see SchemaObjectId#checkRequired #schema_objectid_ObjectId-auto
     * @see SchemaString#checkRequired #schema_string_SchemaString-checkRequired
     * @api public
     */
    required(required, message) {
        let customOptions = {};
        if (typeof required === "object") {
            customOptions = required;
            message = customOptions.message || message;
            required = required.isRequired;
        }

        if (required === false) {
            this.validators = this.validators.filter(function (v) {
                return v.validator !== this.requiredValidator;
            }, this);

            this.isRequired = false;
            return this;
        }

        const _this = this;
        this.isRequired = true;

        this.requiredValidator = function (v) {
            // in here, `this` refers to the validating document.
            // no validation when this path wasn't selected in the query.
            if ("isSelected" in this && !this.isSelected(_this.path) && !this.isModified(_this.path)) {
                return true;
            }

            return ((is.function(required)) && !required.apply(this)) ||
                _this.checkRequired(v, this);
        };
        this.originalRequiredValue = required;

        if (is.string(required)) {
            message = required;
            required = undefined;
        }

        const msg = message || MongooseError.messages.general.required;
        this.validators.unshift(utils.assign({}, customOptions, {
            validator: this.requiredValidator,
            message: msg,
            type: "required"
        }));

        return this;
    }

    /**
     * Gets the default value
     *
     * @param {Object} scope the scope which callback are executed
     * @param {Boolean} init
     * @api private
     */
    getDefault(scope, init) {
        let ret = is.function(this.defaultValue)
            ? is.class(this.defaultValue) ? new this.defaultValue() : this.defaultValue.call(scope)
            : this.defaultValue;

        if (!is.nil(ret)) {
            if (typeof ret === "object" && (!this.options || !this.options.shared)) {
                ret = utils.clone(ret, { retainKeyOrder: true });
            }

            const casted = this.cast(ret, scope, init);
            if (casted && casted.$isSingleNested) {
                casted.$parent = scope;
            }
            return casted;
        }
        return ret;
    }

    /*!
    * Applies setters without casting
    *
    * @api private
    */
    _applySetters(value, scope, init, priorVal) {
        let v = value;
        const setters = this.setters;
        let len = setters.length;
        const caster = this.caster;

        while (len--) {
            v = setters[len].call(scope, v, this);
        }

        if (is.array(v) && caster && caster.setters) {
            const newVal = [];
            for (let i = 0; i < v.length; i++) {
                newVal.push(caster.applySetters(v[i], scope, init, priorVal));
            }
            v = newVal;
        }

        return v;
    }

    /**
     * Applies setters
     *
     * @param {Object} value
     * @param {Object} scope
     * @param {Boolean} init
     * @api private
     */
    applySetters(value, scope, init, priorVal, options) {
        let v = this._applySetters(value, scope, init, priorVal, options);

        if (is.nil(v)) {
            return v;
        }

        // do not cast until all setters are applied #665
        v = this.cast(v, scope, init, priorVal, options);

        return v;
    }

    /**
     * Applies getters to a value
     *
     * @param {Object} value
     * @param {Object} scope
     * @api private
     */
    applyGetters(value, scope) {
        let v = value;
        const getters = this.getters;
        let len = getters.length;

        if (!len) {
            return v;
        }

        while (len--) {
            v = getters[len].call(scope, v, this);
        }

        return v;
    }

    /**
     * Sets default `select()` behavior for this path.
     *
     * Set to `true` if this path should always be included in the results, `false` if it should be excluded by default. This setting can be overridden at the query level.
     *
     * ####Example:
     *
     *     T = db.model('T', new Schema({ x: { type: String, select: true }}));
     *     T.find(..); // field x will always be selected ..
     *     // .. unless overridden;
     *     T.find().select('-x').exec(callback);
     *
     * @param {Boolean} val
     * @return {SchemaType} this
     * @api public
     */
    select(val) {
        this.selected = Boolean(val);
        return this;
    }

    /**
     * Performs a validation of `value` using the validators declared for this SchemaType.
     *
     * @param {any} value
     * @param {Function} callback
     * @param {Object} scope
     * @api private
     */
    doValidate(value, fn, scope) {
        let err = false;
        const path = this.path;
        let count = this.validators.length;

        if (!count) {
            return fn(null);
        }

        const validate = function (ok, validatorProperties) {
            if (err) {
                return;
            }
            if (is.undefined(ok) || ok) {
                --count || fn(null);
            } else {
                const ErrorConstructor = validatorProperties.ErrorConstructor || ValidatorError;
                err = new ErrorConstructor(validatorProperties);
                err.$isValidatorError = true;
                fn(err);
            }
        };

        const _this = this;
        this.validators.forEach((v) => {
            if (err) {
                return;
            }

            const validator = v.validator;
            let ok;

            const validatorProperties = utils.clone(v);
            validatorProperties.path = path;
            validatorProperties.value = value;

            if (validator instanceof RegExp) {
                validate(validator.test(value), validatorProperties);
            } else if (is.function(validator)) {
                if (is.undefined(value) && validator !== _this.requiredValidator) {
                    validate(true, validatorProperties);
                    return;
                }
                if (validatorProperties.isAsync) {
                    asyncValidate(validator, scope, value, validatorProperties, validate);
                } else if (validator.length === 2 && !("isAsync" in validatorProperties)) {
                    legacyAsyncValidate(validator, scope, value, validatorProperties,
                        validate);
                } else {
                    try {
                        // requiredValidator uses "this", but the scope can be undefined and it leads to errors in strict mode
                        ok = validator.call(scope || {}, value);
                    } catch (error) {
                        ok = false;
                        validatorProperties.reason = error;
                    }
                    if (ok && is.function(ok.then)) {
                        ok.then(
                            (ok) => {
                                validate(ok, validatorProperties);
                            },
                            (error) => {
                                validatorProperties.reason = error;
                                ok = false;
                                validate(ok, validatorProperties);
                            });
                    } else {
                        validate(ok, validatorProperties);
                    }
                }
            }
        });
    }

    /**
     * Performs a validation of `value` using the validators declared for this SchemaType.
     *
     * ####Note:
     *
     * This method ignores the asynchronous validators.
     *
     * @param {any} value
     * @param {Object} scope
     * @return {MongooseError|undefined}
     * @api private
     */
    doValidateSync(value, scope) {
        let err = null;
        const path = this.path;
        const count = this.validators.length;

        if (!count) {
            return null;
        }

        const validate = function (ok, validatorProperties) {
            if (err) {
                return;
            }
            if (!is.undefined(ok) && !ok) {
                const ErrorConstructor = validatorProperties.ErrorConstructor || ValidatorError;
                err = new ErrorConstructor(validatorProperties);
                err.$isValidatorError = true;
            }
        };

        let validators = this.validators;
        if (value === void 0) {
            if (this.validators.length > 0 && this.validators[0].type === "required") {
                validators = [this.validators[0]];
            } else {
                return null;
            }
        }

        validators.forEach((v) => {
            if (err) {
                return;
            }

            const validator = v.validator;
            const validatorProperties = utils.clone(v);
            validatorProperties.path = path;
            validatorProperties.value = value;
            let ok;

            if (validator instanceof RegExp) {
                validate(validator.test(value), validatorProperties);
            } else if (is.function(validator)) {
                // if not async validators
                if (validator.length !== 2 && !validatorProperties.isAsync) {
                    try {
                        ok = validator.call(scope, value);
                    } catch (error) {
                        ok = false;
                        validatorProperties.reason = error;
                    }
                    validate(ok, validatorProperties);
                }
            }
        });

        return err;
    }

    /**
     * Determines if value is a valid Reference.
     *
     * @param {SchemaType} self
     * @param {Object} value
     * @param {Document} doc
     * @param {Boolean} init
     * @return {Boolean}
     * @api private
     */
    static _isRef(self, value, doc, init) {
        // fast path
        let ref = init && self.options && self.options.ref;

        if (!ref && doc && doc.$__fullPath) {
            // checks for
            // - this populated with adhoc model and no ref was set in schema OR
            // - setting / pushing values after population
            const path = doc.$__fullPath(self.path);
            const owner = doc.ownerDocument ? doc.ownerDocument() : doc;
            ref = owner.populated(path);
        }

        if (ref) {
            if (is.nil(value)) {
                return true;
            }
            if (!is.buffer(value) && // buffers are objects too
                value._bsontype !== "Binary" // raw binary value from the db
                && utils.isObject(value) // might have deselected _id in population query
            ) {
                return true;
            }
        }

        return false;
    }

    /*!
     * Wraps `castForQuery` to handle context
     */
    castForQueryWrapper(params) {
        this.$$context = params.context;
        if ("$conditional" in params) {
            return this.castForQuery(params.$conditional, params.val);
        }
        if (params.$skipQueryCastForUpdate) {
            return this._castForQuery(params.val);
        }
        return this.castForQuery(params.val);
    }

    /**
     * Cast the given value with the given optional query operator.
     *
     * @param {String} [$conditional] query operator, like `$eq` or `$in`
     * @param {any} val
     * @api private
     */
    castForQuery($conditional, val) {
        let handler;
        if (arguments.length === 2) {
            handler = this.$conditionalHandlers[$conditional];
            if (!handler) {
                throw new Error(`Can't use ${$conditional}`);
            }
            return handler.call(this, val);
        }
        val = $conditional;
        return this._castForQuery(val);
    }

    /*!
     * Internal switch for runSetters
     *
     * @api private
     */
    _castForQuery(val) {
        let runSettersOnQuery = false;
        if (this.$$context &&
            this.$$context.options &&
            "runSettersOnQuery" in this.$$context.options) {
            runSettersOnQuery = this.$$context.options.runSettersOnQuery;
        } else if (this.options && "runSettersOnQuery" in this.options) {
            runSettersOnQuery = this.options.runSettersOnQuery;
        }

        if (runSettersOnQuery) {
            return this.applySetters(val, this.$$context);
        }
        return this.cast(val);
    }

    /**
     * Default check for if this path satisfies the `required` validator.
     *
     * @param {any} val
     * @api private
     */
    checkRequired(val) {
        return !is.nil(val);
    }

}

SchemaType.prototype.$conditionalHandlers = {
    $all: handleArray,
    $eq: handleSingle,
    $in: handleArray,
    $ne: handleSingle,
    $nin: handleArray,
    $exists,
    $type
};

SchemaType.CastError = CastError;
SchemaType.ValidatorError = ValidatorError;
