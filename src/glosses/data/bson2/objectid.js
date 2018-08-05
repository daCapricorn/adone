import { fnv1a24 } from "./fnv1a";

const {
    is,
    std: { os: { hostname } }
} = adone;

/**
 * Machine id.
 *
 * Create a random 3-byte value (i.e. unique for this
 * process). Other drivers use a md5 of the machine id here, but
 * that would mean an asyc call to gethostname, so we don't bother.
 * @ignore
 */
const MACHINE_ID = fnv1a24(hostname);

// Regular expression that checks for hex value
const checkForHexRegExp = new RegExp("^[0-9a-fA-F]{24}$");
let hasBufferType = false;

// Check if buffer exists
try {
    if (Buffer && Buffer.from) {
        hasBufferType = true;
    }
} catch (err) {
    hasBufferType = false;
}

// Precomputed hex table enables speedy hex string conversion
const hexTable = [];
for (let i = 0; i < 256; i++) {
    hexTable[i] = (i <= 15 ? "0" : "") + i.toString(16);
}

// Lookup tables
const decodeLookup = [];
let i = 0;
while (i < 10) {
    decodeLookup[0x30 + i] = i++;
}
while (i < 16) {
    decodeLookup[0x41 - 10 + i] = decodeLookup[0x61 - 10 + i] = i++;
}

const _Buffer = Buffer;
const convertToHex = (bytes) => bytes.toString("hex");


/**
 * A class representation of the BSON ObjectId type.
 */
class ObjectId {
    /**
     * Create an ObjectId type
     *
     * @param {(string|number)} id Can be a 24 byte hex string, 12 byte binary string or a Number.
     * @property {number} generationTime The generation time of this ObjectId instance
     * @return {ObjectId} instance of ObjectId.
     */
    constructor(id) {
        // Duck-typing to support ObjectId from different npm packages
        if (id instanceof ObjectId) {
            return id;
        }

        // The most common usecase (blank id, new objectId instance)
        if (is.nil(id) || is.number(id)) {
            // Generate a new id
            this.id = this.generate(id);
            // If we are caching the hex string
            if (ObjectId.cacheHexString) {
                this.__id = this.toString("hex");
            }
            // Return the object
            return;
        }

        // Check if the passed in id is valid
        const valid = ObjectId.isValid(id);

        // Throw an error if it's not a valid setup
        if (!valid && !is.nil(id)) {
            throw new TypeError(
                "Argument passed in must be a single String of 12 bytes or a string of 24 hex characters"
            );
        } else if (valid && is.string(id) && id.length === 24 && hasBufferType) {
            return new ObjectId(Buffer.from(id, "hex"));
        } else if (valid && is.string(id) && id.length === 24) {
            return ObjectId.createFromHexString(id);
        } else if (!is.nil(id) && id.length === 12) {
            // assume 12 byte string
            this.id = id;
        } else if (!is.nil(id) && id.toHexString) {
            // Duck-typing to support ObjectId from different npm packages
            return id;
        } else {
            throw new TypeError(
                "Argument passed in must be a single String of 12 bytes or a string of 24 hex characters"
            );
        }

        if (ObjectId.cacheHexString) {
            this.__id = this.toString("hex");
        }
    }

    /**
     * Return the ObjectId id as a 24 byte hex string representation
     *
     * @method
     * @return {string} return the 24 byte hex string representation.
     */
    toHexString() {
        if (ObjectId.cacheHexString && this.__id) {
            return this.__id;
        }

        let hexString = "";
        if (!this.id || !this.id.length) {
            throw new TypeError(
                `invalid ObjectId, ObjectId.id must be either a string or a Buffer, but is [${JSON.stringify(this.id)
                }]`
            );
        }

        if (this.id instanceof _Buffer) {
            hexString = convertToHex(this.id);
            if (ObjectId.cacheHexString) {
                this.__id = hexString;
            }
            return hexString;
        }

        for (let i = 0; i < this.id.length; i++) {
            hexString += hexTable[this.id.charCodeAt(i)];
        }

        if (ObjectId.cacheHexString) {
            this.__id = hexString;
        }
        return hexString;
    }

    /**
     * Update the ObjectId index used in generating new ObjectId's on the driver
     *
     * @method
     * @return {number} returns next index value.
     * @ignore
     */
    get_inc() {
        return (ObjectId.index = (ObjectId.index + 1) % 0xffffff);
    }

    /**
     * Update the ObjectId index used in generating new ObjectId's on the driver
     *
     * @method
     * @return {number} returns next index value.
     * @ignore
     */
    getInc() {
        return this.get_inc();
    }

    /**
     * Generate a 12 byte id buffer used in ObjectId's
     *
     * @method
     * @param {number} [time] optional parameter allowing to pass in a second based timestamp.
     * @return {Buffer} return the 12 byte id buffer string.
     */
    generate(time) {
        if (!is.number(time)) {
            time = ~~(Date.now() / 1000);
        }

        // Use pid
        const pid =
            (is.undefined(process) || process.pid === 1
                ? Math.floor(Math.random() * 100000)
                : process.pid) % 0xffff;
        const inc = this.get_inc();
        // Buffer used
        const buffer = Buffer.alloc(12);
        // Encode time
        buffer[3] = time & 0xff;
        buffer[2] = (time >> 8) & 0xff;
        buffer[1] = (time >> 16) & 0xff;
        buffer[0] = (time >> 24) & 0xff;
        // Encode machine
        buffer[6] = MACHINE_ID & 0xff;
        buffer[5] = (MACHINE_ID >> 8) & 0xff;
        buffer[4] = (MACHINE_ID >> 16) & 0xff;
        // Encode pid
        buffer[8] = pid & 0xff;
        buffer[7] = (pid >> 8) & 0xff;
        // Encode index
        buffer[11] = inc & 0xff;
        buffer[10] = (inc >> 8) & 0xff;
        buffer[9] = (inc >> 16) & 0xff;
        // Return the buffer
        return buffer;
    }

    /**
     * Converts the id into a 24 byte hex string for printing
     *
     * @param {String} format The Buffer toString format parameter.
     * @return {String} return the 24 byte hex string representation.
     * @ignore
     */
    toString(format) {
        // Is the id a buffer then use the buffer toString method to return the format
        if (this.id && this.id.copy) {
            return this.id.toString(is.string(format) ? format : "hex");
        }

        return this.toHexString();
    }

    /**
     * Converts to its JSON representation.
     *
     * @return {String} return the 24 byte hex string representation.
     * @ignore
     */
    toJSON() {
        return this.toHexString();
    }

    /**
     * Compares the equality of this ObjectId with `otherID`.
     *
     * @method
     * @param {object} otherID ObjectId instance to compare against.
     * @return {boolean} the result of comparing two ObjectId's
     */
    equals(otherId) {
        if (otherId instanceof ObjectId) {
            return this.toString() === otherId.toString();
        }

        if (
            is.string(otherId) &&
            ObjectId.isValid(otherId) &&
            otherId.length === 12 &&
            this.id instanceof _Buffer
        ) {
            return otherId === this.id.toString("binary");
        }

        if (is.string(otherId) && ObjectId.isValid(otherId) && otherId.length === 24) {
            return otherId.toLowerCase() === this.toHexString();
        }

        if (is.string(otherId) && ObjectId.isValid(otherId) && otherId.length === 12) {
            return otherId === this.id;
        }

        if (!is.nil(otherId) && (otherId instanceof ObjectId || otherId.toHexString)) {
            return otherId.toHexString() === this.toHexString();
        }

        return false;
    }

    /**
     * Returns the generation date (accurate up to the second) that this ID was generated.
     *
     * @method
     * @return {date} the generation date
     */
    getTimestamp() {
        const timestamp = new Date();
        const time = this.id[3] | (this.id[2] << 8) | (this.id[1] << 16) | (this.id[0] << 24);
        timestamp.setTime(Math.floor(time) * 1000);
        return timestamp;
    }

    /**
     * @ignore
     */
    static createPk() {
        return new ObjectId();
    }

    /**
     * Creates an ObjectId from a second based number, with the rest of the ObjectId zeroed out. Used for comparisons or sorting the ObjectId.
     *
     * @method
     * @param {number} time an integer number representing a number of seconds.
     * @return {ObjectId} return the created ObjectId
     */
    static createFromTime(time) {
        const buffer = Buffer.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
        // Encode time into first 4 bytes
        buffer[3] = time & 0xff;
        buffer[2] = (time >> 8) & 0xff;
        buffer[1] = (time >> 16) & 0xff;
        buffer[0] = (time >> 24) & 0xff;
        // Return the new objectId
        return new ObjectId(buffer);
    }

    /**
     * Creates an ObjectId from a hex string representation of an ObjectId.
     *
     * @method
     * @param {string} hexString create a ObjectId from a passed in 24 byte hexstring.
     * @return {ObjectId} return the created ObjectId
     */
    static createFromHexString(string) {
        // Throw an error if it's not a valid setup
        if (is.undefined(string) || (!is.nil(string) && string.length !== 24)) {
            throw new TypeError(
                "Argument passed in must be a single String of 12 bytes or a string of 24 hex characters"
            );
        }

        // Use Buffer.from method if available
        if (hasBufferType) {
            return new ObjectId(Buffer.from(string, "hex"));
        }

        // Calculate lengths
        const array = new _Buffer(12);

        let n = 0;
        let i = 0;
        while (i < 24) {
            array[n++] =
                (decodeLookup[string.charCodeAt(i++)] << 4) | decodeLookup[string.charCodeAt(i++)];
        }

        return new ObjectId(array);
    }

    /**
     * Checks if a value is a valid bson ObjectId
     *
     * @method
     * @return {boolean} return true if the value is a valid bson ObjectId, return false otherwise.
     */
    static isValid(id) {
        if (is.nil(id)) {
            return false;
        }

        if (is.number(id)) {
            return true;
        }

        if (is.string(id)) {
            return id.length === 12 || (id.length === 24 && checkForHexRegExp.test(id));
        }

        if (id instanceof ObjectId) {
            return true;
        }

        if (id instanceof _Buffer) {
            return true;
        }

        // Duck-Typing detection of ObjectId like objects
        if (id.toHexString) {
            return id.id.length === 12 || (id.id.length === 24 && checkForHexRegExp.test(id.id));
        }

        return false;
    }
}

/**
 * @ignore
 */
Object.defineProperty(ObjectId.prototype, "generationTime", {
    enumerable: true,
    get() {
        return this.id[3] | (this.id[2] << 8) | (this.id[1] << 16) | (this.id[0] << 24);
    },
    set(value) {
        // Encode time into first 4 bytes
        this.id[3] = value & 0xff;
        this.id[2] = (value >> 8) & 0xff;
        this.id[1] = (value >> 16) & 0xff;
        this.id[0] = (value >> 24) & 0xff;
    }
});

/**
 * Converts to a string representation of this Id.
 *
 * @return {String} return the 24 byte hex string representation.
 * @ignore
 */
ObjectId.prototype.inspect = ObjectId.prototype.toString;

/**
 * @ignore
 */
ObjectId.index = ~~(Math.random() * 0xffffff);

Object.defineProperty(ObjectId.prototype, "_bsontype", { value: "ObjectId" });
module.exports = ObjectId;
