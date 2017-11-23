const { is, vendor: { lodash: _ } } = adone;

const dataTypes = require("./data_types");
const util = require("util");

function escape(val, timeZone, dialect, format) {
    let prependN = false;
    if (is.nil(val)) {
        return "NULL";
    }
    switch (typeof val) {
        case "boolean":
            // SQLite doesn't have true/false support. MySQL aliases true/false to 1/0
            // for us. Postgres actually has a boolean type with true/false literals,
            // but sequelize doesn't use it yet.
            if (dialect === "sqlite" || dialect === "mssql") {
                return Number(Boolean(val));
            }
            return `${Boolean(val)}`;
        case "number":
            return String(val);
        case "string":
            // In mssql, prepend N to all quoted vals which are originally a string (for
            // unicode compatibility)
            prependN = dialect === "mssql";
            break;
    }

    if (val instanceof Date) {
        val = dataTypes[dialect].DATE.prototype.stringify(val, { timezone: timeZone });
    }

    if (is.buffer(val)) {
        if (dataTypes[dialect].BLOB) {
            return dataTypes[dialect].BLOB.prototype.stringify(val);
        }

        return dataTypes.BLOB.prototype.stringify(val);
    }

    if (is.array(val)) {
        const partialEscape = _.partial(escape, _, timeZone, dialect, format);
        if (dialect === "postgres" && !format) {
            return dataTypes.ARRAY.prototype.stringify(val, { escape: partialEscape });
        }
        return val.map(partialEscape);
    }

    if (!val.replace) {
        throw new Error(`Invalid value ${util.inspect(val)}`);
    }

    if (dialect === "postgres" || dialect === "sqlite" || dialect === "mssql") {
        // http://www.postgresql.org/docs/8.2/static/sql-syntax-lexical.html#SQL-SYNTAX-STRINGS
        // http://stackoverflow.com/q/603572/130598
        val = val.replace(/'/g, "''");
    } else {
        val = val.replace(/[\0\n\r\b\t\\\'\"\x1a]/g, (s) => {
            switch (s) {
                case "\0": return "\\0";
                case "\n": return "\\n";
                case "\r": return "\\r";
                case "\b": return "\\b";
                case "\t": return "\\t";
                case "\x1a": return "\\Z";
                default: return `\\${s}`;
            }
        });
    }
    return `${(prependN ? "N'" : "'") + val}'`;
}
exports.escape = escape;

function format(sql, values, timeZone, dialect) {
    values = [].concat(values);

    if (!is.string(sql)) {
        throw new Error(`Invalid SQL string provided: ${sql}`);
    }
    return sql.replace(/\?/g, (match) => {
        if (!values.length) {
            return match;
        }

        return escape(values.shift(), timeZone, dialect, true);
    });
}
exports.format = format;

function formatNamedParameters(sql, values, timeZone, dialect) {
    return sql.replace(/\:+(?!\d)(\w+)/g, (value, key) => {
        if (dialect === "postgres" && value.slice(0, 2) === "::") {
            return value;
        }

        if (!is.undefined(values[key])) {
            return escape(values[key], timeZone, dialect, true);
        }
        throw new Error(`Named parameter "${value}" has no value in the given object.`);

    });
}
exports.formatNamedParameters = formatNamedParameters;