adone.definePredicates({
    identity: "CRYPTO_IDENTITY"
});

adone.lazify({
    stringCompare: "./string_compare",
    Keygrip: "./keygrip",
    password: "./password",
    asn1: "./asn1",
    crc32: "./crc32",
    EVPBytesToKey: "./evp_bytes_to_key",
    formatEcdsa: "./ecdsa_format",
    jwa: "./jwa",
    jws: "./jws",
    jwt: "./jwt",
    secp256k1: "./secp256k1",
    hash: "./hashes",
    pki: "./pki",
    random: "./random",
    md: "./md",
    pkcs1: "./pkcs1",
    pkcs5: "./pkcs5",
    pem: "./pem",
    pss: "./pss",
    ed25519: "./ed25519",
    mgf: "./mgf",
    hmac: "./hmac",
    aes: "./aes",
    keys: "./keys",
    pbkdf2: "./pbkdf2",
    Identity: "./identity"
}, adone.asNamespace(exports), require);
