const {
    is,
    error,
    lodash: _,
    cli: { prompt: { Separator } }
} = adone;

/**
 * Choice object
 * Normalize input as choice object
 * @constructor
 * @param {String|Object} val  Choice value. If an object is passed, it should contains
 *                             at least one of `value` or `name` property
 */
class Choice {
    constructor(val, answers) {
        // Don't process Choice and Separator object
        if (val instanceof Choice || val.type === "separator") {
            return val;
        }

        if (is.string(val)) {
            this.name = val;
            this.value = val;
            this.short = val;
        } else {
            _.extend(this, val, {
                name: val.name || val.value,
                value: "value" in val ? val.value : val.name,
                short: val.short || val.name || val.value
            });
        }

        if (is.function(val.disabled)) {
            this.disabled = val.disabled(answers);
        } else {
            this.disabled = val.disabled;
        }
    }
}

/**
 * Choices collection
 * Collection of multiple `choice` object
 * @constructor
 * @param {Array} choices  All `choice` to keep in the collection
 */
export default class Choices {
    constructor(term, choices, answers) {
        this.term = term;
        this.choices = choices.map((val) => {
            if (val.type === "separator") {
                if (!(val instanceof Separator)) {
                    val = new Separator(val.line);
                }
                return val;
            }
            return new Choice(val, answers);
        });

        this.realChoices = this.choices.filter(Separator.exclude).filter((item) => !item.disabled);
    }

    get length() {
        return this.choices.length;
    }

    set length(val) {
        this.choices.length = val;
    }

    get realLength() {
        return this.realChoices.length;
    }

    set realLength(val) {
        throw new Error("Cannot set `realLength` of a Choices collection");
    }

    /**
     * Get a valid choice from the collection
     * @param  {Number} selector  The selected choice index
     * @return {Choice|Undefined} Return the matched choice or undefined
     */
    getChoice(selector) {
        if (!is.number(selector)) {
            throw new error.InvalidArgumentException("Selector must be a number");
        }
        return this.realChoices[selector];
    }

    /**
     * Get a raw element from the collection
     * @param  {Number} selector  The selected index value
     * @return {Choice|Undefined} Return the matched choice or undefined
     */
    get(selector) {
        if (!is.number(selector)) {
            throw new error.InvalidArgumentException("Selector must be a number");
        }
        return this.choices[selector];
    }

    /**
     * Match the valid choices against a where clause
     * @param  {Object} whereClause Lodash `where` clause
     * @return {Array}              Matching choices or empty array
     */
    where(whereClause) {
        return _.filter(this.realChoices, whereClause);
    }

    /**
     * Pluck a particular key from the choices
     * @param  {String} propertyName Property name to select
     * @return {Array}               Selected properties
     */
    pluck(propertyName) {
        return _.map(this.realChoices, propertyName);
    }

    // Expose usual Array methods
    indexOf(element, position) {
        return this.choices.indexOf(element, position);
    }

    forEach(callback, thisArg) {
        return this.choices.forEach(callback, thisArg);
    }

    filter(callback, thisArg) {
        return this.choices.filter(callback, thisArg);
    }

    find(func) {
        return _.find(this.choices, func);
    }

    push(...args) {
        this.choices.push(...args.map((x) => new Choice(x)));
        this.realChoices = this.choices.filter(Separator.exclude);
        return this.choices;
    }
}

Choices.Choice = Choice;