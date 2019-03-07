const {
    is
} = adone;

module.exports = function base16(alphabet) {
    return {
        encode(input) {
            if (is.string(input)) {
                return Buffer.from(input).toString("hex");
            }
            return input.toString("hex");
        },
        decode(input) {
            for (const char of input) {
                if (alphabet.indexOf(char) < 0) {
                    throw new Error("invalid base16 character");
                }
            }
            return Buffer.from(input, "hex");
        }
    };
};
