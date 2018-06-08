export default function getInteropBlock(dependencies, options, varOrConst) {
    return dependencies
        .map(({ name, exportsNames, exportsDefault, namedExportsMode }) => {
        if (!namedExportsMode)
            return;
        if (!exportsDefault || options.interop === false)
            return null;
        if (exportsNames) {
            if (options.compact)
                return `${varOrConst} ${name}__default='default'in ${name}?${name}['default']:${name};`;
            return `${varOrConst} ${name}__default = 'default' in ${name} ? ${name}['default'] : ${name};`;
        }
        if (options.compact)
            return `${name}=${name}&&${name}.hasOwnProperty('default')?${name}['default']:${name};`;
        return `${name} = ${name} && ${name}.hasOwnProperty('default') ? ${name}['default'] : ${name};`;
    })
        .filter(Boolean)
        .join(options.compact ? '' : '\n');
}
