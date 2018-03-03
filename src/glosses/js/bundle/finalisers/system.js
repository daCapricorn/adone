function getStarExcludes({ dependencies, exports }) {
    const starExcludes = new Set(exports.map((expt) => expt.exported));
    if (!starExcludes.has("default")) {
        starExcludes.add("default"); 
    }
    // also include reexport names
    dependencies.forEach(({ reexports }) => {
        if (reexports) {
            reexports.forEach((reexport) => {
                if (reexport.imported !== "*" && !starExcludes.has(reexport.reexported)) {
                    starExcludes.add(reexport.reexported); 
                }
            });
        }
    });
    return starExcludes;
}
export default function system(chunk, magicString, { getPath, indentString: t, intro, outro }) {
    const { dependencies, exports } = chunk.getModuleDeclarations();
    const dependencyIds = dependencies.map((m) => `'${getPath(m.id)}'`);
    const importBindings = [];
    let starExcludes;
    const setters = [];
    const varOrConst = chunk.graph.varOrConst;
    dependencies.forEach(({ imports, reexports }) => {
        const setter = [];
        if (imports) {
            imports.forEach((specifier) => {
                importBindings.push(specifier.local);
                if (specifier.imported === "*") {
                    setter.push(`${specifier.local} = module;`);
                } else {
                    setter.push(`${specifier.local} = module.${specifier.imported};`);
                }
            });
        }
        if (reexports) {
            // bulk-reexport form
            if (reexports.length > 1 || reexports.length === 1 && reexports[0].imported === "*") {
                setter.push(`${varOrConst} _setter = {};`);
                // star reexports
                reexports.forEach((specifier) => {
                    if (specifier.imported !== "*") {
                        return; 
                    }
                    // need own exports list for deduping in star export case
                    if (!starExcludes) {
                        starExcludes = getStarExcludes({ dependencies, exports });
                    }
                    setter.push("for (var _$p in module) {");
                    setter.push(`${t}if (!_starExcludes[_$p]) _setter[_$p] = module[_$p];`);
                    setter.push("}");
                });
                // reexports
                reexports.forEach((specifier) => {
                    if (specifier.imported === "*") {
                        return;
                    }
                    setter.push(`_setter.${specifier.reexported} = module.${specifier.imported};`);
                });
                setter.push("exports(_setter);");
            } else {
                reexports.forEach((specifier) => {
                    setter.push(`exports('${specifier.reexported}', module.${specifier.imported});`);
                });
            }
        }
        setters.push(setter.join(`\n${t}${t}${t}`));
    });
    // function declarations hoist
    const functionExports = [];
    exports.forEach((expt) => {
        if (expt.hoisted) {
            functionExports.push(`exports('${expt.exported}', ${expt.local});`); 
        }
    });
    const starExcludesSection = !starExcludes ? "" :
        `\n${t}${varOrConst} _starExcludes = { ${Array.from(starExcludes).join(": 1, ")}${starExcludes.size ? ": 1" : ""} };`;
    const importBindingsSection = importBindings.length ? `\n${t}var ${importBindings.join(", ")};` : "";
    const wrapperStart = `System.register([${dependencyIds.join(", ")}], function (exports, module) {
${t}'use strict';${starExcludesSection}${importBindingsSection}
${t}return {${setters.length ? `\n${t}${t}setters: [${setters.map((s) => `function (module) {
${t}${t}${t}${s}
${t}${t}}`).join(", ")}],` : ""}
${t}${t}execute: function () {

${functionExports.length ? `${t}${t}${t}${functionExports.join(`\n${t}${t}${t}`)}\n` : ""}`;
    if (intro) {
        magicString.prepend(intro);
    }
    if (outro) {
        magicString.append(outro); 
    }
    return magicString // TODO TypeScript: Awaiting PR
        .indent(`${t}${t}${t}`)
        .append(`\n\n${t}${t}}\n${t}};\n});`)
        .prepend(wrapperStart);
}