const {
    crypto: { asn1 }
} = adone;

const {
    Constructed
} = asn1;

export default class Set extends Constructed {
    /**
	 * Constructor for "Set" class
	 * @param {Object} [parameters={}]
	 */
    constructor(parameters = {}) {
        super(parameters);

        this.idBlock.tagClass = 1; // UNIVERSAL
        this.idBlock.tagNumber = 17; // Set
    }

    /**
	 * Aux function, need to get a block name. Need to have it here for inhiritence
	 * @returns {string}
	 */
    static blockName() {
        return "Set";
    }
}