const {
    is,
    vendor: { lodash: _ },
    orm
} = adone;

const {
    util,
    Transaction,
    operator
} = orm;

const {
    association
} = adone.private(orm);

/**
 * One-to-one association
 */
export default class BelongsTo extends association.Base {
    constructor(source, target, options) {
        super(source, target, options);

        this.associationType = "BelongsTo";
        this.isSingleAssociation = true;
        this.foreignKeyAttribute = {};

        if (this.as) {
            this.isAliased = true;
            this.options.name = {
                singular: this.as
            };
        } else {
            this.as = this.target.options.name.singular;
            this.options.name = this.target.options.name;
        }

        if (_.isObject(this.options.foreignKey)) {
            this.foreignKeyAttribute = this.options.foreignKey;
            this.foreignKey = this.foreignKeyAttribute.name || this.foreignKeyAttribute.fieldName;
        } else if (this.options.foreignKey) {
            this.foreignKey = this.options.foreignKey;
        }

        if (!this.foreignKey) {
            this.foreignKey = util.camelizeIf(
                [
                    util.underscoredIf(this.as, this.source.options.underscored),
                    this.target.primaryKeyAttribute
                ].join("_"),
                !this.source.options.underscored
            );
        }

        this.identifier = this.foreignKey;

        if (this.source.rawAttributes[this.identifier]) {
            this.identifierField = this.source.rawAttributes[this.identifier].field || this.identifier;
        }

        this.targetKey = this.options.targetKey || this.target.primaryKeyAttribute;
        this.targetKeyField = this.target.rawAttributes[this.targetKey].field || this.targetKey;
        this.targetKeyIsPrimary = this.targetKey === this.target.primaryKeyAttribute;

        this.targetIdentifier = this.targetKey;
        this.associationAccessor = this.as;
        this.options.useHooks = options.useHooks;

        // Get singular name, trying to uppercase the first letter, unless the model forbids it
        const singular = util.uppercaseFirst(this.options.name.singular);

        this.accessors = {
            get: `get${singular}`,
            set: `set${singular}`,
            create: `create${singular}`
        };
    }

    injectAttributes() {
        const newAttributes = {};

        newAttributes[this.foreignKey] = _.defaults({}, this.foreignKeyAttribute, {
            type: this.options.keyType || this.target.rawAttributes[this.targetKey].type,
            allowNull: true
        });

        if (this.options.constraints !== false) {
            const source = this.source.rawAttributes[this.foreignKey] || newAttributes[this.foreignKey];
            this.options.onDelete = this.options.onDelete || (source.allowNull ? "SET NULL" : "NO ACTION");
            this.options.onUpdate = this.options.onUpdate || "CASCADE";
        }

        util.addForeignKeyConstraints(newAttributes[this.foreignKey], this.target, this.source, this.options, this.targetKeyField);
        util.mergeDefaults(this.source.rawAttributes, newAttributes);

        this.identifierField = this.source.rawAttributes[this.foreignKey].field || this.foreignKey;

        this.source.refreshAttributes();

        util.checkNamingCollision(this);

        return this;
    }

    mixin(obj) {
        const methods = ["get", "set", "create"];

        util.mixinMethods(this, obj, methods);
    }

    /**
     * Get the associated instance.
     *
     * @param {Object} [options]
     * @param {String|Boolean} [options.scope] Apply a scope on the related model, or remove its default scope by passing false.
     * @param {String} [options.schema] Apply a schema on the related model
     * @return {Promise<Model>}
     */
    async get(instances, options) {
        const association = this;
        const where = {};
        let Target = association.target;
        let instance;

        options = util.cloneDeep(options);

        if (options.hasOwnProperty("scope")) {
            if (!options.scope) {
                Target = Target.unscoped();
            } else {
                Target = Target.scope(options.scope);
            }
        }

        if (options.hasOwnProperty("schema")) {
            Target = Target.schema(options.schema, options.schemaDelimiter);
        }

        if (!is.array(instances)) {
            instance = instances;
            instances = undefined;
        }

        if (instances) {
            where[association.targetKey] = {
                [operator.in]: instances.map((instance) => instance.get(association.foreignKey))
            };
        } else {
            if (association.targetKeyIsPrimary && !options.where) {
                return Target.findById(instance.get(association.foreignKey), options);
            }
            where[association.targetKey] = instance.get(association.foreignKey);
            options.limit = null;

        }

        options.where = options.where ?
            { [operator.and]: [where, options.where] } :
            where;

        if (instances) {
            const results = await Target.findAll(options);
            const result = {};
            for (const instance of instances) {
                result[instance.get(association.foreignKey, { raw: true })] = null;
            }

            for (const instance of results) {
                result[instance.get(association.targetKey, { raw: true })] = instance;
            }

            return result;
        }

        return Target.findOne(options);
    }

    /**
     * Set the associated model.
     *
     * @param {Model|String|Number} [newAssociation] An persisted instance or the primary key of an instance to associate with this. Pass `null` or `undefined` to remove the association.
     * @param {Object} [options] Options passed to `this.save`
     * @param {Boolean} [options.save=true] Skip saving this after setting the foreign key if false.
     * @return {Promise}
     */
    set(sourceInstance, associatedInstance, options) {
        const association = this;

        options = options || {};

        let value = associatedInstance;
        if (associatedInstance instanceof association.target) {
            value = associatedInstance[association.targetKey];
        }

        sourceInstance.set(association.foreignKey, value);

        if (options.save === false) {
            return;
        }

        options = _.extend({
            fields: [association.foreignKey],
            allowNull: [association.foreignKey],
            association: true
        }, options);

        // passes the changed field to save, so only that field get updated.
        return sourceInstance.save(options);
    }

    /**
     * Create a new instance of the associated model and associate it with this.
     *
     * @param {Object} [values]
     * @param {Object} [options] Options passed to `target.create` and setAssociation.
     * @return {Promise}
     */
    async create(sourceInstance, values, fieldsOrOptions) {
        const association = this;

        const options = {};

        if ((fieldsOrOptions || {}).transaction instanceof Transaction) {
            options.transaction = fieldsOrOptions.transaction;
        }
        options.logging = (fieldsOrOptions || {}).logging;

        const newAssociatedObject = await association.target.create(values, fieldsOrOptions);

        return sourceInstance[association.accessors.set](newAssociatedObject, options);
    }
}
