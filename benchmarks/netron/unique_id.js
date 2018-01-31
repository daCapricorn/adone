const {
    math: { Long },
    netron2: { UniqueId, FastUniqueId }
} = adone;

let fastUniq;
let uniq;

export const init = () => {
    fastUniq = new FastUniqueId();
    uniq = new UniqueId();

    adone.log("Maximum value of integer sequencer:", Number.MAX_SAFE_INTEGER >>> 0);
    adone.log("Maximum value of long sequencer:", Long.MAX_UNSIGNED_VALUE.toString());
};

export default {
    "FastUniqueId"() {
        return fastUniq.next();
    },
    "UniqueId"() {
        return uniq.next();
    }
};
