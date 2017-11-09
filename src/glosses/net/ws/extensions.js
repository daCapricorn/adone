const { is } = adone;

const parse = (value) => {
    value = value || "";

    const extensions = {};

    value.split(",").forEach((v) => {
        const params = v.split(";");
        const token = params.shift().trim();

        if (is.undefined(extensions[token])) {
            extensions[token] = [];
        } else if (!extensions.hasOwnProperty(token)) {
            return;
        }

        const parsedParams = {};

        params.forEach((param) => {
            const parts = param.trim().split("=");
            const key = parts[0];
            let value = parts[1];

            if (is.undefined(value)) {
                value = true;
            } else {
                // unquote value
                if (value[0] === '"') {
                    value = value.slice(1);
                }
                if (value[value.length - 1] === '"') {
                    value = value.slice(0, value.length - 1);
                }
            }
            if (is.undefined(parsedParams[key])) {
                parsedParams[key] = [value];
            } else if (parsedParams.hasOwnProperty(key)) {
                parsedParams[key].push(value);
            }
        });

        extensions[token].push(parsedParams);
    });

    return extensions;
};

/**
 * Serialize a parsed `Sec-WebSocket-Extensions` header to a string.
 *
 * @param {Object} value The object to format
 * @return {String} A string representing the given value
 * @public
 */
const format = (value) => {
    return Object.keys(value).map((token) => {
        let paramsList = value[token];
        if (!is.array(paramsList)) {
            paramsList = [paramsList];
        }
        return paramsList.map((params) => {
            return [token].concat(Object.keys(params).map((k) => {
                let p = params[k];
                if (!is.array(p)) {
                    p = [p];
                }
                return p.map((v) => v === true ? k : `${k}=${v}`).join("; ");
            })).join("; ");
        }).join(", ");
    }).join(", ");
};

export { format, parse };
