

const forgePbkdf2 = require("node-forge/lib/pbkdf2");
const forgeUtil = require("node-forge/lib/util");

/**
 * Maps an IPFS hash name to its node-forge equivalent.
 *
 * See https://github.com/multiformats/multihash/blob/master/hashtable.csv
 *
 * @private
 */
const hashName = {
    sha1: "sha1",
    "sha2-256": "sha256",
    "sha2-512": "sha512"
};

/**
 * Computes the Password-Based Key Derivation Function 2.
 *
 * @param {string} password
 * @param {string} salt
 * @param {number} iterations
 * @param {number} keySize (in bytes)
 * @param {string} hash - The hash name ('sha1', 'sha2-512, ...)
 * @returns {string} - A new password
 */
function pbkdf2(password, salt, iterations, keySize, hash) {
    const hasher = hashName[hash];
    if (!hasher) {
        throw new Error(`Hash '${hash}' is unknown or not supported`);
    }
    const dek = forgePbkdf2(
        password,
        salt,
        iterations,
        keySize,
        hasher);
    return forgeUtil.encode64(dek);
}

module.exports = pbkdf2;
