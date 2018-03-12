const {
    is,
    lodash: _,
    orm
} = adone;

const {
    util,
    error,
    operator
} = orm;

const {
    association
} = adone.private(orm);

/**
 * Many-to-many association with a join table.
 */
export default class BelongsToMany extends association.Base {
    constructor(source, target, options) {
        super(source, target, options);

        if (is.undefined(this.options.through) || this.options.through === true || is.null(this.options.through)) {
            throw new error.AssociationError("belongsToMany must be given a through option, either a string or a model");
        }

        if (!this.options.through.model) {
            this.options.through = {
                model: options.through
            };
        }

        this.associationType = "BelongsToMany";
        this.targetAssociation = null;
        this.sequelize = source.sequelize;
        this.through = _.assign({}, this.options.through);
        this.isMultiAssociation = true;
        this.doubleLinked = false;

        if (!this.as && this.isSelfAssociation) {
            throw new error.AssociationError("'as' must be defined for many-to-many self-associations");
        }

        if (this.as) {
            this.isAliased = true;

            if (_.isPlainObject(this.as)) {
                this.options.name = this.as;
                this.as = this.as.plural;
            } else {
                this.options.name = {
                    plural: this.as,
                    singular: util.singularize(this.as)
                };
            }
        } else {
            this.as = this.target.options.name.plural;
            this.options.name = this.target.options.name;
        }

        this.combinedTableName = util.combineTableNames(
            this.source.tableName,
            this.isSelfAssociation ? this.as || this.target.tableName : this.target.tableName
        );

        /*
         * If self association, this is the target association - Unless we find a pairing association
         */
        if (this.isSelfAssociation) {
            this.targetAssociation = this;
        }

        /*
         * Default/generated foreign/other keys
         */
        if (_.isObject(this.options.foreignKey)) {
            this.foreignKeyAttribute = this.options.foreignKey;
            this.foreignKey = this.foreignKeyAttribute.name || this.foreignKeyAttribute.fieldName;
        } else {
            if (!this.options.foreignKey) {
                this.foreignKeyDefault = true;
            }

            this.foreignKeyAttribute = {};
            this.foreignKey = this.options.foreignKey || util.camelizeIf(
                [
                    util.underscoredIf(this.source.options.name.singular, this.source.options.underscored),
                    this.source.primaryKeyAttribute
                ].join("_"),
                !this.source.options.underscored
            );
        }

        if (_.isObject(this.options.otherKey)) {
            this.otherKeyAttribute = this.options.otherKey;
            this.otherKey = this.otherKeyAttribute.name || this.otherKeyAttribute.fieldName;
        } else {
            if (!this.options.otherKey) {
                this.otherKeyDefault = true;
            }

            this.otherKeyAttribute = {};
            this.otherKey = this.options.otherKey || util.camelizeIf(
                [
                    util.underscoredIf(
                        this.isSelfAssociation ?
                            util.singularize(this.as) :
                            this.target.options.name.singular,
                        this.target.options.underscored
                    ),
                    this.target.primaryKeyAttribute
                ].join("_"),
                !this.target.options.underscored
            );
        }

        /*
         * Find paired association (if exists)
         */
        _.each(this.target.associations, (association) => {
            if (association.associationType !== "BelongsToMany") {
                return;
            }
            if (association.target !== this.source) {
                return;
            }

            if (this.options.through.model === association.options.through.model) {
                this.paired = association;
                association.paired = this;
            }
        });

        if (is.string(this.through.model)) {
            if (!this.sequelize.isDefined(this.through.model)) {
                this.through.model = this.sequelize.define(this.through.model, {}, _.extend(this.options, {
                    tableName: this.through.model,
                    indexes: [], //we don't want indexes here (as referenced in #2416)
                    paranoid: false, // A paranoid join table does not make sense
                    validate: {} // Don't propagate model-level validations
                }));
            } else {
                this.through.model = this.sequelize.model(this.through.model);
            }
        }

        this.options = Object.assign(this.options, _.pick(this.through.model.options, [
            "timestamps", "createdAt", "updatedAt", "deletedAt", "paranoid"
        ]));

        if (this.paired) {
            if (this.otherKeyDefault) {
                this.otherKey = this.paired.foreignKey;
            }
            if (this.paired.otherKeyDefault) {
                // If paired otherKey was inferred we should make sure to clean it up before adding a new one that matches the foreignKey
                if (this.paired.otherKey !== this.foreignKey) {
                    delete this.through.model.rawAttributes[this.paired.otherKey];
                }
                this.paired.otherKey = this.foreignKey;
                this.paired.foreignIdentifier = this.foreignKey;
                delete this.paired.foreignIdentifierField;
            }
        }

        if (this.through) {
            this.throughModel = this.through.model;
        }

        this.options.tableName = this.combinedName = this.through.model === Object(this.through.model) ? this.through.model.tableName : this.through.model;

        this.associationAccessor = this.as;

        // Get singular and plural names, trying to uppercase the first letter, unless the model forbids it
        const plural = util.uppercaseFirst(this.options.name.plural);
        const singular = util.uppercaseFirst(this.options.name.singular);

        this.accessors = {
            get: `get${plural}`,
            set: `set${plural}`,
            addMultiple: `add${plural}`,
            add: `add${singular}`,
            create: `create${singular}`,
            remove: `remove${singular}`,
            removeMultiple: `remove${plural}`,
            hasSingle: `has${singular}`,
            hasAll: `has${plural}`,
            count: `count${plural}`
        };
    }

    injectAttributes() {

        this.identifier = this.foreignKey;
        this.foreignIdentifier = this.otherKey;

        // remove any PKs previously defined by sequelize
        // but ignore any keys that are part of this association (#5865)
        _.each(this.through.model.rawAttributes, (attribute, attributeName) => {
            if (attribute.primaryKey === true && attribute._autoGenerated === true) {
                if (attributeName === this.foreignKey || attributeName === this.otherKey) {
                    // this key is still needed as it's part of the association
                    // so just set primaryKey to false
                    attribute.primaryKey = false;
                } else {
                    delete this.through.model.rawAttributes[attributeName];
                }
                this.primaryKeyDeleted = true;
            }
        });

        const sourceKey = this.source.rawAttributes[this.source.primaryKeyAttribute];
        const sourceKeyType = sourceKey.type;
        const sourceKeyField = sourceKey.field || this.source.primaryKeyAttribute;
        const targetKey = this.target.rawAttributes[this.target.primaryKeyAttribute];
        const targetKeyType = targetKey.type;
        const targetKeyField = targetKey.field || this.target.primaryKeyAttribute;
        const sourceAttribute = _.defaults({}, this.foreignKeyAttribute, { type: sourceKeyType });
        const targetAttribute = _.defaults({}, this.otherKeyAttribute, { type: targetKeyType });

        if (this.primaryKeyDeleted === true) {
            targetAttribute.primaryKey = sourceAttribute.primaryKey = true;
        } else if (this.through.unique !== false) {
            const uniqueKey = [this.through.model.tableName, this.foreignKey, this.otherKey, "unique"].join("_");
            targetAttribute.unique = sourceAttribute.unique = uniqueKey;
        }

        if (!this.through.model.rawAttributes[this.foreignKey]) {
            this.through.model.rawAttributes[this.foreignKey] = {
                _autoGenerated: true
            };
        }

        if (!this.through.model.rawAttributes[this.otherKey]) {
            this.through.model.rawAttributes[this.otherKey] = {
                _autoGenerated: true
            };
        }

        if (this.options.constraints !== false) {
            sourceAttribute.references = {
                model: this.source.getTableName(),
                key: sourceKeyField
            };
            // For the source attribute the passed option is the priority
            sourceAttribute.onDelete = this.options.onDelete || this.through.model.rawAttributes[this.foreignKey].onDelete;
            sourceAttribute.onUpdate = this.options.onUpdate || this.through.model.rawAttributes[this.foreignKey].onUpdate;

            if (!sourceAttribute.onDelete) {
                sourceAttribute.onDelete = "CASCADE";
            }
            if (!sourceAttribute.onUpdate) {
                sourceAttribute.onUpdate = "CASCADE";
            }

            targetAttribute.references = {
                model: this.target.getTableName(),
                key: targetKeyField
            };
            // But the for target attribute the previously defined option is the priority (since it could've been set by another belongsToMany call)
            targetAttribute.onDelete = this.through.model.rawAttributes[this.otherKey].onDelete || this.options.onDelete;
            targetAttribute.onUpdate = this.through.model.rawAttributes[this.otherKey].onUpdate || this.options.onUpdate;

            if (!targetAttribute.onDelete) {
                targetAttribute.onDelete = "CASCADE";
            }
            if (!targetAttribute.onUpdate) {
                targetAttribute.onUpdate = "CASCADE";
            }
        }

        this.through.model.rawAttributes[this.foreignKey] = _.extend(this.through.model.rawAttributes[this.foreignKey], sourceAttribute);
        this.through.model.rawAttributes[this.otherKey] = _.extend(this.through.model.rawAttributes[this.otherKey], targetAttribute);

        this.identifierField = this.through.model.rawAttributes[this.foreignKey].field || this.foreignKey;
        this.foreignIdentifierField = this.through.model.rawAttributes[this.otherKey].field || this.otherKey;

        if (this.paired && !this.paired.foreignIdentifierField) {
            this.paired.foreignIdentifierField = this.through.model.rawAttributes[this.paired.otherKey].field || this.paired.otherKey;
        }

        this.through.model.refreshAttributes();

        this.toSource = new association.BelongsTo(this.through.model, this.source, {
            foreignKey: this.foreignKey
        });
        this.manyFromSource = new association.HasMany(this.source, this.through.model, {
            foreignKey: this.foreignKey
        });
        this.oneFromSource = new association.HasOne(this.source, this.through.model, {
            foreignKey: this.foreignKey,
            as: this.through.model.name
        });

        this.toTarget = new association.BelongsTo(this.through.model, this.target, {
            foreignKey: this.otherKey
        });
        this.manyFromTarget = new association.HasMany(this.target, this.through.model, {
            foreignKey: this.otherKey
        });
        this.oneFromTarget = new association.HasOne(this.target, this.through.model, {
            foreignKey: this.otherKey,
            as: this.through.model.name
        });

        if (this.paired && this.paired.otherKeyDefault) {
            this.paired.toTarget = new association.BelongsTo(this.paired.through.model, this.paired.target, {
                foreignKey: this.paired.otherKey
            });

            this.paired.oneFromTarget = new association.HasOne(this.paired.target, this.paired.through.model, {
                foreignKey: this.paired.otherKey,
                as: this.paired.through.model.name
            });
        }

        util.checkNamingCollision(this);

        return this;
    }

    mixin(obj) {
        const methods = ["get", "count", "hasSingle", "hasAll", "set", "add", "addMultiple", "remove", "removeMultiple", "create"];
        const aliases = {
            hasSingle: "has",
            hasAll: "has",
            addMultiple: "add",
            removeMultiple: "remove"
        };

        util.mixinMethods(this, obj, methods, aliases);
    }

    /**
     * Get everything currently associated with this, using an optional where clause.
     *
     * @param {object} [options]
     * @param {object} [options.where] An optional where clause to limit the associated models
     * @param {string|boolean} [options.scope] Apply a scope on the related model, or remove its default scope by passing false
     * @param {string} [options.schema] Apply a schema on the related model
     * @return {Promise<Array<Model>>}
     */
    get(instance, options) {
        options = util.cloneDeep(options) || {};

        const association = this;
        const through = association.through;
        let scopeWhere;
        let throughWhere;

        if (association.scope) {
            scopeWhere = _.clone(association.scope);
        }

        options.where = {
            [operator.and]: [
                scopeWhere,
                options.where
            ]
        };

        if (Object(through.model) === through.model) {
            throughWhere = {};
            throughWhere[association.foreignKey] = instance.get(association.source.primaryKeyAttribute);

            if (through.scope) {
                _.assign(throughWhere, through.scope);
            }

            //If a user pass a where on the options through options, make an "and" with the current throughWhere
            if (options.through && options.through.where) {
                throughWhere = {
                    [operator.and]: [throughWhere, options.through.where]
                };
            }

            options.include = options.include || [];
            options.include.push({
                association: association.oneFromTarget,
                attributes: options.joinTableAttributes,
                required: true,
                where: throughWhere
            });
        }

        let model = association.target;
        if (options.hasOwnProperty("scope")) {
            if (!options.scope) {
                model = model.unscoped();
            } else {
                model = model.scope(options.scope);
            }
        }

        if (options.hasOwnProperty("schema")) {
            model = model.schema(options.schema, options.schemaDelimiter);
        }

        return model.findAll(options);
    }

    /**
     * Count everything currently associated with this, using an optional where clause.
     *
     * @param {Object} [options]
     * @param {Object} [options.where] An optional where clause to limit the associated models
     * @param {String|Boolean} [options.scope] Apply a scope on the related model, or remove its default scope by passing false
     * @return {Promise<Integer>}
     */
    count(instance, options) {
        const association = this;
        const model = association.target;
        const sequelize = model.sequelize;

        options = util.cloneDeep(options);
        options.attributes = [
            [sequelize.fn("COUNT", sequelize.col([association.target.name, model.primaryKeyField].join("."))), "count"]
        ];
        options.joinTableAttributes = [];
        options.raw = true;
        options.plain = true;

        return association.get(instance, options).then((result) => parseInt(result.count, 10));
    }

    /**
   * Check if one or more instance(s) are associated with this. If a list of instances is passed, the function returns true if _all_ instances are associated
   *
   * @param {Model[]|Model|string[]|String|number[]|Number} [instance(s)] Can be an array of instances or their primary keys
   * @param {Object} [options] Options passed to getAssociations
   * @return {Promise<boolean>}
   */
    has(sourceInstance, instances, options) {
        const association = this;
        const where = {};

        if (!is.array(instances)) {
            instances = [instances];
        }

        options = _.assign({
            raw: true
        }, options, {
            scope: false
        });

        where[operator.or] = instances.map((instance) => {
            if (instance instanceof association.target) {
                return instance.where();
            }
            const where = {};
            where[association.target.primaryKeyAttribute] = instance;
            return where;

        });

        options.where = {
            [operator.and]: [
                where,
                options.where
            ]
        };

        return association.get(sourceInstance, options).then((associatedObjects) => associatedObjects.length === instances.length);
    }

    /**
     * Set the associated models by passing an array of instances or their primary keys. Everything that it not in the passed array will be un-associated.
     *
     * @param {Array<Model|String|Number>} [newAssociations] An array of persisted instances or primary key of instances to associate with this. Pass `null` or `undefined` to remove all associations.
     * @param {Object} [options] Options passed to `through.findAll`, `bulkCreate`, `update` and `destroy`
     * @param {Object} [options.validate] Run validation for the join model
     * @param {Object} [options.through] Additional attributes for the join table.
     * @return {Promise}
     */
    async set(sourceInstance, newAssociatedObjects, options) {
        options = options || {};

        const association = this;
        const sourceKey = association.source.primaryKeyAttribute;
        const targetKey = association.target.primaryKeyAttribute;
        const identifier = association.identifier;
        const foreignIdentifier = association.foreignIdentifier;
        let where = {};

        if (is.null(newAssociatedObjects)) {
            newAssociatedObjects = [];
        } else {
            newAssociatedObjects = association.toInstanceArray(newAssociatedObjects);
        }

        where[identifier] = sourceInstance.get(sourceKey);
        where = Object.assign(where, association.through.scope);

        const currentRows = await association.through.model.findAll(_.defaults({ where, raw: true }, options));

        const obsoleteAssociations = [];
        const promises = [];
        let defaultAttributes = options.through || {};

        // Don't try to insert the transaction as an attribute in the through table
        defaultAttributes = _.omit(defaultAttributes, ["transaction", "hooks", "individualHooks", "ignoreDuplicates", "validate", "fields", "logging"]);

        const unassociatedObjects = newAssociatedObjects.filter((obj) =>
            !_.find(currentRows, (currentRow) => currentRow[foreignIdentifier] === obj.get(targetKey))
        );

        for (const currentRow of currentRows) {
            const newObj = _.find(newAssociatedObjects, (obj) => currentRow[foreignIdentifier] === obj.get(targetKey));

            if (!newObj) {
                obsoleteAssociations.push(currentRow);
            } else {
                let throughAttributes = newObj[association.through.model.name];
                // Quick-fix for subtle bug when using existing objects that might have the through model attached (not as an attribute object)
                if (throughAttributes instanceof association.through.model) {
                    throughAttributes = {};
                }

                const where = {};
                const attributes = _.defaults({}, throughAttributes, defaultAttributes);

                where[identifier] = sourceInstance.get(sourceKey);
                where[foreignIdentifier] = newObj.get(targetKey);

                if (Object.keys(attributes).length) {
                    promises.push(association.through.model.update(attributes, _.extend(options, { where })));
                }
            }
        }

        if (obsoleteAssociations.length > 0) {
            let where = {};
            where[identifier] = sourceInstance.get(sourceKey);
            where[foreignIdentifier] = obsoleteAssociations.map((obsoleteAssociation) => obsoleteAssociation[foreignIdentifier]);
            where = Object.assign(where, association.through.scope);
            promises.push(association.through.model.destroy(_.defaults({ where }, options)));
        }

        if (unassociatedObjects.length > 0) {
            const bulk = unassociatedObjects.map((unassociatedObject) => {
                let attributes = {};

                attributes[identifier] = sourceInstance.get(sourceKey);
                attributes[foreignIdentifier] = unassociatedObject.get(targetKey);

                attributes = _.defaults(attributes, unassociatedObject[association.through.model.name], defaultAttributes);

                _.assign(attributes, association.through.scope);
                attributes = Object.assign(attributes, association.through.scope);

                return attributes;
            });

            promises.push(association.through.model.bulkCreate(bulk, _.assign({ validate: true }, options)));
        }

        return Promise.all(promises);
    }

    /**
     * Associate one ore several rows with `this`.
     *
     * @param {Model[]|Model|string[]|string|number[]|Number} [newAssociation(s)] A single instance or primary key, or a mixed array of persisted instances or primary keys
     * @param {Object} [options] Options passed to `through.findAll`, `bulkCreate` and `update`
     * @param {Object} [options.validate] Run validation for the join model.
     * @param {Object} [options.through] Additional attributes for the join table.
     * @return {Promise}
     */
    async add(sourceInstance, newInstances, options) {
        // If newInstances is null or undefined, no-op
        if (!newInstances) {
            return;
        }

        options = _.clone(options) || {};

        const association = this;
        const sourceKey = association.source.primaryKeyAttribute;
        const targetKey = association.target.primaryKeyAttribute;
        const identifier = association.identifier;
        const foreignIdentifier = association.foreignIdentifier;
        const defaultAttributes = _.omit(options.through || {}, ["transaction", "hooks", "individualHooks", "ignoreDuplicates", "validate", "fields", "logging"]);

        newInstances = association.toInstanceArray(newInstances);

        const where = {};
        where[identifier] = sourceInstance.get(sourceKey);
        where[foreignIdentifier] = newInstances.map((newInstance) => newInstance.get(targetKey));

        _.assign(where, association.through.scope);

        const currentRows = await association.through.model.findAll(_.defaults({ where, raw: true }, options));

        const promises = [];
        const unassociatedObjects = [];
        const changedAssociations = [];
        for (const obj of newInstances) {
            const existingAssociation = _.find(currentRows, (current) => current[foreignIdentifier] === obj.get(targetKey));

            if (!existingAssociation) {
                unassociatedObjects.push(obj);
            } else {
                const throughAttributes = obj[association.through.model.name];
                const attributes = _.defaults({}, throughAttributes, defaultAttributes);

                if (_.some(Object.keys(attributes), (attribute) => attributes[attribute] !== existingAssociation[attribute])) {
                    changedAssociations.push(obj);
                }
            }
        }

        if (unassociatedObjects.length > 0) {
            const bulk = unassociatedObjects.map((unassociatedObject) => {
                const throughAttributes = unassociatedObject[association.through.model.name];
                const attributes = _.defaults({}, throughAttributes, defaultAttributes);

                attributes[identifier] = sourceInstance.get(sourceKey);
                attributes[foreignIdentifier] = unassociatedObject.get(targetKey);

                _.assign(attributes, association.through.scope);

                return attributes;
            });

            promises.push(association.through.model.bulkCreate(bulk, _.assign({ validate: true }, options)));
        }

        for (const assoc of changedAssociations) {
            let throughAttributes = assoc[association.through.model.name];
            const attributes = _.defaults({}, throughAttributes, defaultAttributes);
            const where = {};
            // Quick-fix for subtle bug when using existing objects that might have the through model attached (not as an attribute object)
            if (throughAttributes instanceof association.through.model) {
                throughAttributes = {};
            }

            where[identifier] = sourceInstance.get(sourceKey);
            where[foreignIdentifier] = assoc.get(targetKey);

            promises.push(association.through.model.update(attributes, _.extend(options, { where })));
        }

        return Promise.all(promises);
    }

    /**
     * Un-associate one or more instance(s).
     *
     * @param {Model|String|Number} [oldAssociated] Can be an Instance or its primary key, or a mixed array of instances and primary keys
     * @param {Object} [options] Options passed to `through.destroy`
     * @return {Promise}
     */
    remove(sourceInstance, oldAssociatedObjects, options) {
        const association = this;

        options = options || {};

        oldAssociatedObjects = association.toInstanceArray(oldAssociatedObjects);

        const where = {};
        where[association.identifier] = sourceInstance.get(association.source.primaryKeyAttribute);
        where[association.foreignIdentifier] = oldAssociatedObjects.map((newInstance) => newInstance.get(association.target.primaryKeyAttribute));

        return association.through.model.destroy(_.defaults({ where }, options));
    }

    /**
     * Create a new instance of the associated model and associate it with this.
     *
     * @param {Object} [values]
     * @param {Object} [options] Options passed to create and add
     * @param {Object} [options.through] Additional attributes for the join table
     * @return {Promise}
     */
    async create(sourceInstance, values, options) {
        const association = this;

        options = options || {};
        values = values || {};

        if (is.array(options)) {
            options = {
                fields: options
            };
        }

        if (association.scope) {
            _.assign(values, association.scope);
            if (options.fields) {
                options.fields = options.fields.concat(Object.keys(association.scope));
            }
        }

        // Create the related model instance
        const newAssociatedObject = await association.target.create(values, options);
        await sourceInstance[association.accessors.add](newAssociatedObject, _.omit(options, ["fields"]));
        return newAssociatedObject;
    }
}
