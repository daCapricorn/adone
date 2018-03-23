const {
    netron2: { Netron }
} = adone;

export const createNetron = (peerId, addrs) => {
    const netron = new Netron(peerId);
    netron.createNetCore("default", {
        addrs
    });
    return netron;
};
