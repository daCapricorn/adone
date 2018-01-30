const {
    is,
    x
} = adone;

const setBit = (target, offset) => target | (1 << offset);

const clearBit = (target, offset) => target & ~(1 << offset);

const getBit = (target, offset) => (target >> offset) & 1;

const clearBits = (target, offset, count) => {
    const maxOffset = offset + count;
    for (let i = offset; i < maxOffset; ++i) {
        target &= ~(1 << i);
    }

    return target;
};

const writeBits = (target, val, offset, count) => {
    const maxOffset = offset + count;
    if (val & 1) {
        target |= (1 << offset);
    }
    for (let i = offset + 1; i < maxOffset; ++i) {
        if (val & (1 << (i - offset))) {
            target |= (1 << i);
        }
    }

    return target;
};

const readBits = (target, offset, count) => {
    let val = 0 >>> 0;
    const maxOffset = offset + count;
    for (let i = offset; i < maxOffset; ++i) {
        if (getBit(target, i)) {
            val |= (1 << (i - offset));
        }
    }
    return val;
};

/**
 * Represents netron packet.
 * 
 * Packet fields in left to right order:
 * - flags - contains impulse and action values (uint8)
 * - id    - packet id (uint32)
 * - data  - custom data
 * 
 *    name | offset | bits | min/max
 *   -------------------------------- 
 *   action       0      7  0x00-0x7F 
 *  impulse       7      1  0|1
 * 
 */
export default class Packet {
    constructor() {
        this.flags = 0x00;
        this.id = undefined;
        this.data = undefined;
    }

    setAction(action) {
        this.flags = writeBits(clearBits(this.flags, 0, 7), action, 0, 7);
    }

    getAction() {
        return readBits(this.flags, 0, 7);
    }

    setImpulse(impulse) {
        this.flags = impulse === 1 ? setBit(this.flags, 7) : clearBit(this.flags, 7);
    }

    getImpulse() {
        return getBit(this.flags, 7);
    }

    get raw() {
        return [this.flags, this.id, this.data];
    }

    static create(id, impulse, action, data) {
        const packet = new Packet();
        packet.setImpulse(impulse);
        packet.setAction(action);
        packet.id = id;
        packet.data = data;
        return packet;
    }

    static from(rawPacket) {
        if (!is.array(rawPacket) || rawPacket.length !== 3) {
            throw new x.NotValid("Bad packet");
        }

        const packet = new Packet();
        [packet.flags, packet.id, packet.data] = rawPacket;
        return packet;
    }
}
