/**
 * Partial implementation of PKCS#1 v2.2: RSA-OEAP
 *
 * Modified but based on the following MIT and BSD licensed code:
 *
 * https://github.com/kjur/jsjws/blob/master/rsa.js:
 *
 * The 'jsjws'(JSON Web Signature JavaScript Library) License
 *
 * Copyright (c) 2012 Kenji Urushima
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * http://webrsa.cvs.sourceforge.net/viewvc/webrsa/Client/RSAES-OAEP.js?content-type=text%2Fplain:
 *
 * RSAES-OAEP.js
 * $Id: RSAES-OAEP.js,v 1.1.1.1 2003/03/19 15:37:20 ellispritchard Exp $
 * JavaScript Implementation of PKCS #1 v2.1 RSA CRYPTOGRAPHY STANDARD (RSA Laboratories, June 14, 2002)
 * Copyright (C) Ellis Pritchard, Guardian Unlimited 2003.
 * Contact: ellis@nukinetics.com
 * Distributed under the BSD License.
 *
 * Official documentation: http://www.rsa.com/rsalabs/node.asp?id=2125
 *
 * @author Evan Jones (http://evanjones.ca/)
 * @author Dave Longley
 *
 * Copyright (c) 2013-2014 Digital Bazaar, Inc.
 */

const {
    is,
    crypto
} = adone;

const forge = require("node-forge");

const rsaMgf1 = (seed, maskLength, hash) => {
    // default to SHA-1 message digest
    if (!hash) {
        hash = crypto.md.sha1.create();
    }
    let t = "";
    const count = Math.ceil(maskLength / hash.digestLength);
    for (let i = 0; i < count; ++i) {
        const c = String.fromCharCode(
            (i >> 24) & 0xFF, (i >> 16) & 0xFF, (i >> 8) & 0xFF, i & 0xFF);
        hash.start();
        hash.update(seed + c);
        t += hash.digest().getBytes();
    }
    return t.substring(0, maskLength);
};


/**
 * Encode the given RSAES-OAEP message (M) using key, with optional label (L)
 * and seed.
 *
 * This method does not perform RSA encryption, it only encodes the message
 * using RSAES-OAEP.
 *
 * @param key the RSA key to use.
 * @param message the message to encode.
 * @param options the options to use:
 *          label an optional label to use.
 *          seed the seed to use.
 *          md the message digest object to use, undefined for SHA-1.
 *          mgf1 optional mgf1 parameters:
 *            md the message digest object to use for MGF1.
 *
 * @return the encoded message bytes.
 */
export const encodeRSAOAEP = function (key, message, options) {
    // parse arguments
    let label;
    let seed;
    let md;
    let mgf1Md;
    // legacy args (label, seed, md)
    if (is.string(options)) {
        label = options;
        seed = arguments[3] || undefined;
        md = arguments[4] || undefined;
    } else if (options) {
        label = options.label || undefined;
        seed = options.seed || undefined;
        md = options.md || undefined;
        if (options.mgf1 && options.mgf1.md) {
            mgf1Md = options.mgf1.md;
        }
    }

    // default OAEP to SHA-1 message digest
    if (!md) {
        md = crypto.md.sha1.create();
    } else {
        md.start();
    }

    // default MGF-1 to same as OAEP
    if (!mgf1Md) {
        mgf1Md = md;
    }

    // compute length in bytes and check output
    const keyLength = Math.ceil(key.n.bitLength() / 8);
    const maxLength = keyLength - 2 * md.digestLength - 2;
    if (message.length > maxLength) {
        const error = new Error("RSAES-OAEP input message length is too long.");
        error.length = message.length;
        error.maxLength = maxLength;
        throw error;
    }

    if (!label) {
        label = "";
    }
    md.update(label, "raw");
    const lHash = md.digest();

    let PS = "";
    const PS_length = maxLength - message.length;
    for (let i = 0; i < PS_length; i++) {
        PS += "\x00";
    }

    const DB = `${lHash.getBytes() + PS}\x01${message}`;

    if (!seed) {
        seed = forge.random.getBytes(md.digestLength);
    } else if (seed.length !== md.digestLength) {
        const error = new Error("Invalid RSAES-OAEP seed. The seed length must match the digest length.");
        error.seedLength = seed.length;
        error.digestLength = md.digestLength;
        throw error;
    }

    const dbMask = rsaMgf1(seed, keyLength - md.digestLength - 1, mgf1Md);
    const maskedDB = forge.util.xorBytes(DB, dbMask, DB.length);

    const seedMask = rsaMgf1(maskedDB, md.digestLength, mgf1Md);
    const maskedSeed = forge.util.xorBytes(seed, seedMask, seed.length);

    // return encoded message
    return `\x00${maskedSeed}${maskedDB}`;
};

/**
 * Decode the given RSAES-OAEP encoded message (EM) using key, with optional
 * label (L).
 *
 * This method does not perform RSA decryption, it only decodes the message
 * using RSAES-OAEP.
 *
 * @param key the RSA key to use.
 * @param em the encoded message to decode.
 * @param options the options to use:
 *          label an optional label to use.
 *          md the message digest object to use for OAEP, undefined for SHA-1.
 *          mgf1 optional mgf1 parameters:
 *            md the message digest object to use for MGF1.
 *
 * @return the decoded message bytes.
 */
export const decodeRSAOAEP = function (key, em, options) {
    // parse args
    let label;
    let md;
    let mgf1Md;
    // legacy args
    if (is.string(options)) {
        label = options;
        md = arguments[3] || undefined;
    } else if (options) {
        label = options.label || undefined;
        md = options.md || undefined;
        if (options.mgf1 && options.mgf1.md) {
            mgf1Md = options.mgf1.md;
        }
    }

    // compute length in bytes
    const keyLength = Math.ceil(key.n.bitLength() / 8);

    if (em.length !== keyLength) {
        const error = new Error("RSAES-OAEP encoded message length is invalid.");
        error.length = em.length;
        error.expectedLength = keyLength;
        throw error;
    }

    // default OAEP to SHA-1 message digest
    if (is.undefined(md)) {
        md = crypto.md.sha1.create();
    } else {
        md.start();
    }

    // default MGF-1 to same as OAEP
    if (!mgf1Md) {
        mgf1Md = md;
    }

    if (keyLength < 2 * md.digestLength + 2) {
        throw new Error("RSAES-OAEP key is too short for the hash function.");
    }

    if (!label) {
        label = "";
    }
    md.update(label, "raw");
    const lHash = md.digest().getBytes();

    // split the message into its parts
    const y = em.charAt(0);
    const maskedSeed = em.substring(1, md.digestLength + 1);
    const maskedDB = em.substring(1 + md.digestLength);

    const seedMask = rsaMgf1(maskedDB, md.digestLength, mgf1Md);
    const seed = forge.util.xorBytes(maskedSeed, seedMask, maskedSeed.length);

    const dbMask = rsaMgf1(seed, keyLength - md.digestLength - 1, mgf1Md);
    const db = forge.util.xorBytes(maskedDB, dbMask, maskedDB.length);

    const lHashPrime = db.substring(0, md.digestLength);

    // constant time check that all values match what is expected
    let error = (y !== "\x00");

    // constant time check lHash vs lHashPrime
    for (let i = 0; i < md.digestLength; ++i) {
        error |= (lHash.charAt(i) !== lHashPrime.charAt(i));
    }

    // "constant time" find the 0x1 byte separating the padding (zeros) from the
    // message
    // TODO: It must be possible to do this in a better/smarter way?
    let in_ps = 1;
    let index = md.digestLength;
    for (let j = md.digestLength; j < db.length; j++) {
        const code = db.charCodeAt(j);

        const is_0 = (code & 0x1) ^ 0x1;

        // non-zero if not 0 or 1 in the ps section
        const error_mask = in_ps ? 0xfffe : 0x0000;
        error |= (code & error_mask);

        // latch in_ps to zero after we find 0x1
        in_ps = in_ps & is_0;
        index += in_ps;
    }

    if (error || db.charCodeAt(index) !== 0x1) {
        throw new Error("Invalid RSAES-OAEP padding.");
    }

    return db.substring(index + 1);
};