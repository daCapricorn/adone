import { applyToDefaults } from "../../utils";

export const concat = function (target, source) {
    if (!source) {
        return target;
    }

    const obj = Object.assign({}, target);

    const sKeys = Object.keys(source);
    for (let i = 0; i < sKeys.length; ++i) {
        const key = sKeys[i];
        if (key !== "language" || !obj.hasOwnProperty(key)) {
            obj[key] = source[key];
        } else {
            obj[key] = applyToDefaults(obj[key], source[key]);
        }
    }

    return obj;
};
