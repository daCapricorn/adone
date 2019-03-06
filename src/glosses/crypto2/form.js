/**
 * Functions for manipulating web forms.
 *
 * @author David I. Lehn <dlehn@digitalbazaar.com>
 * @author Dave Longley
 * @author Mike Johnson
 *
 * Copyright (c) 2011-2014 Digital Bazaar, Inc. All rights reserved.
 */
const forge = require("./forge");

/**
 * Form API
 */
const form = module.exports = forge.form = forge.form || {};

(function ($) {

    /**
     * Regex for parsing a single name property (handles array brackets).
     */
    const _regex = /([^\[]*?)\[(.*?)\]/g;

    /**
     * Parses a single name property into an array with the name and any
     * array indices.
     *
     * @param name the name to parse.
     *
     * @return the array of the name and its array indices in order.
     */
    const _parseName = function (name) {
        const rval = [];

        let matches;
        while ((matches = _regex.exec(name))) {
            if (matches[1].length > 0) {
                rval.push(matches[1]);
            }
            if (matches.length >= 2) {
                rval.push(matches[2]);
            }
        }
        if (rval.length === 0) {
            rval.push(name);
        }

        return rval;
    };

    /**
     * Adds a field from the given form to the given object.
     *
     * @param obj the object.
     * @param names the field as an array of object property names.
     * @param value the value of the field.
     * @param dict a dictionary of names to replace.
     */
    const _addField = function (obj, names, value, dict) {
        // combine array names that fall within square brackets
        var tmp = [];
        for (let i = 0; i < names.length; ++i) {
            // check name for starting square bracket but no ending one
            let name = names[i];
            if (name.indexOf("[") !== -1 && name.indexOf("]") === -1 &&
      i < names.length - 1) {
                do {
                    name += `.${names[++i]}`;
                } while (i < names.length - 1 && names[i].indexOf("]") === -1);
            }
            tmp.push(name);
        }
        names = tmp;

        // split out array indexes
        var tmp = [];
        $.each(names, (n, name) => {
            tmp = tmp.concat(_parseName(name));
        });
        names = tmp;

        // iterate over object property names until value is set
        $.each(names, (n, name) => {
            // do dictionary name replacement
            if (dict && name.length !== 0 && name in dict) {
                name = dict[name];
            }

            // blank name indicates appending to an array, set name to
            // new last index of array
            if (name.length === 0) {
                name = obj.length;
            }

            // value already exists, append value
            if (obj[name]) {
                // last name in the field
                if (n == names.length - 1) {
                    // more than one value, so convert into an array
                    if (!$.isArray(obj[name])) {
                        obj[name] = [obj[name]];
                    }
                    obj[name].push(value);
                } else {
                    // not last name, go deeper into object
                    obj = obj[name];
                }
            } else if (n == names.length - 1) {
                // new value, last name in the field, set value
                obj[name] = value;
            } else {
                // new value, not last name, go deeper
                // get next name
                const next = names[n + 1];

                // blank next value indicates array-appending, so create array
                if (next.length === 0) {
                    obj[name] = [];
                } else {
                    // if next name is a number create an array, otherwise a map
                    const isNum = ((next - 0) == next && next.length > 0);
                    obj[name] = isNum ? [] : {};
                }
                obj = obj[name];
            }
        });
    };

    /**
     * Serializes a form to a JSON object. Object properties will be separated
     * using the given separator (defaults to '.') and by square brackets.
     *
     * @param input the jquery form to serialize.
     * @param sep the object-property separator (defaults to '.').
     * @param dict a dictionary of names to replace (name=replace).
     *
     * @return the JSON-serialized form.
     */
    form.serialize = function (input, sep, dict) {
        const rval = {};

        // add all fields in the form to the object
        sep = sep || ".";
        $.each(input.serializeArray(), function () {
            _addField(rval, this.name.split(sep), this.value || "", dict);
        });

        return rval;
    };

})(jQuery);