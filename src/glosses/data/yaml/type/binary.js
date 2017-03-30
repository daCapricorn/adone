const { data: { yaml }, is } = adone;

// [ 64, 65, 66 ] -> [ padding, CR, LF ]
const BASE64_MAP = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r";

const resolveYamlBinary = (data) => {
    if (is.null(data)) {
        return false;
    }

    let code;
    let bitlen = 0;

    // Convert one by one.
    for (let idx = 0; idx < data.length; ++idx) {
        code = BASE64_MAP.indexOf(data.charAt(idx));

        // Skip CR/LF
        if (code > 64) {
            continue;
        }

        // Fail on illegal characters
        if (code < 0) {
            return false;
        }

        bitlen += 6;
    }

    // If there are any bits left, source was corrupted
    return bitlen % 8 === 0;
};

const constructYamlBinary = (data) => {
    const input = data.replace(/[\r\n=]/g, ""); // remove CR/LF & padding to simplify scan
    const max = input.length;
    let bits = 0;
    const result = [];

    // Collect by 6*4 bits (3 bytes)

    for (let idx = 0; idx < input.length; idx++) {
        if (idx % 4 === 0 && idx) {
            result.push((bits >> 16) & 0xFF);
            result.push((bits >> 8) & 0xFF);
            result.push(bits & 0xFF);
        }

        bits = (bits << 6) | BASE64_MAP.indexOf(input.charAt(idx));
    }

    // Dump tail

    const tailbits = (max % 4) * 6;

    if (tailbits === 0) {
        result.push((bits >> 16) & 0xFF);
        result.push((bits >> 8) & 0xFF);
        result.push(bits & 0xFF);
    } else if (tailbits === 18) {
        result.push((bits >> 10) & 0xFF);
        result.push((bits >> 2) & 0xFF);
    } else if (tailbits === 12) {
        result.push((bits >> 4) & 0xFF);
    }

    return Buffer.from(result);
};

const representYamlBinary = (object) => {
    const map = BASE64_MAP;

    // Convert every three bytes to 4 ASCII characters.
    let bits = 0;
    let result = "";
    for (let idx = 0; idx < object.length; idx++) {
        if (idx % 3 === 0 && idx) {
            result += map[(bits >> 18) & 0x3F];
            result += map[(bits >> 12) & 0x3F];
            result += map[(bits >> 6) & 0x3F];
            result += map[bits & 0x3F];
        }

        bits = (bits << 8) + object[idx];
    }

    // Dump tail

    const tail = object.length % 3;

    if (tail === 0) {
        result += map[(bits >> 18) & 0x3F];
        result += map[(bits >> 12) & 0x3F];
        result += map[(bits >> 6) & 0x3F];
        result += map[bits & 0x3F];
    } else if (tail === 2) {
        result += map[(bits >> 10) & 0x3F];
        result += map[(bits >> 4) & 0x3F];
        result += map[(bits << 2) & 0x3F];
        result += map[64];
    } else if (tail === 1) {
        result += map[(bits >> 2) & 0x3F];
        result += map[(bits << 4) & 0x3F];
        result += map[64];
        result += map[64];
    }

    return result;
};

export default new yaml.type.Type("tag:yaml.org,2002:binary", {
    kind: "scalar",
    resolve: resolveYamlBinary,
    construct: constructYamlBinary,
    predicate: is.buffer,
    represent: representYamlBinary
});
