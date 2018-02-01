const { lazify } = adone;

const util = lazify({
    pathval: "./pathval",
    test: "./test",
    expectTypes: "./expect_types",
    getMessage: "./get_message",
    inspect: "./inspect",
    objDisplay: "./obj_display",
    flag: "./flag",
    transferFlags: "./transfer_flags",
    addProperty: "./add_property",
    addMethod: "./add_method",
    overwriteProperty: "./overwrite_property",
    overwriteMethod: "./overwrite_method",
    addChainableMethod: "./add_chainable_method",
    overwriteChainableMethod: "./overwrite_chainable_method",
    compareByInspect: "./compare_by_inspect",
    getOwnEnumerablePropertySymbols: "./get_own_enumerable_property_symbols",
    getOwnEnumerableProperties: "./get_own_enumerable_properties",
    getEnumerableProperties: "./get_enumerable_properties",
    checkError: "./check_error",
    proxify: "./proxify",
    addLengthGuard: "./add_length_guard",
    isProxyEnabled: "./is_proxy_enabled",
    getActual: "./get_actual",
    getProperties: "./get_properties",
    type: () => adone.meta.typeOf,
    eql: () => adone.is.deepEqual,
    eqlArray: () => adone.is.equalArrays,
    getPathInfo: () => util.pathval.getPathInfo,
    hasProperty: () => util.pathval.hasProperty,
    getName: () => adone.util.functionName
}, exports, require);
