import { blank } from "../utils/object";
import error from "../utils/error";
import getInteropBlock from "./shared/getInteropBlock";
import getExportBlock from "./shared/getExportBlock";
import getGlobalNameMaker from "./shared/getGlobalNameMaker";
import esModuleExport from "./shared/esModuleExport";
import { property, keypath } from "./shared/sanitize";
import warnOnBuiltins from "./shared/warnOnBuiltins";
import trimEmptyImports from "./shared/trimEmptyImports";
import setupNamespace from "./shared/setupNamespace";
function globalProp(name) {
    if (!name) {
        return "null"; 
    }
    return `global${keypath(name)}`;
}
function safeAccess(name) {
    const parts = name.split(".");
    let acc = "global";
    return parts.map((part) => ((acc += property(part)), acc)).join(" && ");
}
const wrapperOutro = "\n\n})));";
export default function umd(chunk, magicString, { exportMode, indentString, getPath, intro, outro }, options) {
    if (exportMode !== "none" && !options.name) {
        error({
            code: "INVALID_OPTION",
            message: "You must supply options.name for UMD bundles"
        });
    }
    warnOnBuiltins(chunk);
    const moduleDeclarations = chunk.getModuleDeclarations();
    const globalNameMaker = getGlobalNameMaker(options.globals || blank(), chunk);
    const amdDeps = chunk.externalModules.map((m) => `'${getPath(m.id)}'`);
    const cjsDeps = chunk.externalModules.map((m) => `require('${getPath(m.id)}')`);
    const trimmed = trimEmptyImports(chunk.externalModules);
    const globalDeps = trimmed.map((module) => globalProp(globalNameMaker(module)));
    const args = trimmed.map((m) => m.name);
    if (exportMode === "named") {
        amdDeps.unshift("'exports'");
        cjsDeps.unshift("exports");
        globalDeps.unshift(`(${setupNamespace(options.name, "global", true, options.globals)} = ${options.extend ? `${globalProp(options.name)} || ` : ""}{})`);
        args.unshift("exports");
    }
    const amdOptions = options.amd || {};
    const amdParams = (amdOptions.id ? `'${amdOptions.id}', ` : "") +
        (amdDeps.length ? `[${amdDeps.join(", ")}], ` : "");
    const define = amdOptions.define || "define";
    const cjsExport = exportMode === "default" ? "module.exports = " : "";
    const defaultExport = exportMode === "default"
        ? `${setupNamespace(options.name, "global", true, options.globals)} = `
        : "";
    const useStrict = options.strict !== false ? " 'use strict';" : "";
    let globalExport;
    if (options.noConflict === true) {
        let factory;
        if (exportMode === "default") {
            factory = `var exports = factory(${globalDeps});`;
        } else if (exportMode === "named") {
            const module = globalDeps.shift();
            factory = `var exports = ${module};
				factory(${["exports"].concat(globalDeps)});`;
        }
        globalExport = `(function() {
				var current = ${safeAccess(options.name)};
				${factory}
				${globalProp(options.name)} = exports;
				exports.noConflict = function() { ${globalProp(options.name)} = current; return exports; };
			})()`;
    } else {
        globalExport = `(${defaultExport}factory(${globalDeps}))`;
    }
    const wrapperIntro = `(function (global, factory) {
			typeof exports === 'object' && typeof module !== 'undefined' ? ${cjsExport}factory(${cjsDeps.join(", ")}) :
			typeof ${define} === 'function' && ${define}.amd ? ${define}(${amdParams}factory) :
			${globalExport};
		}(this, (function (${args}) {${useStrict}

		`
        .replace(/^\t\t/gm, "")
        .replace(/^\t/gm, indentString || "\t");
    // var foo__default = 'default' in foo ? foo['default'] : foo;
    const interopBlock = getInteropBlock(chunk, options);
    if (interopBlock) {
        magicString.prepend(`${interopBlock}\n\n`);
    }
    if (intro) {
        magicString.prepend(intro);
    }
    const exportBlock = getExportBlock(moduleDeclarations.exports, moduleDeclarations.dependencies, exportMode);
    if (exportBlock) {
        magicString.append(`\n\n${exportBlock}`);
    } // TODO TypeScript: Awaiting PR
    if (exportMode === "named" && options.legacy !== true) {
        magicString.append(`\n\n${esModuleExport}`); 
    } // TODO TypeScript: Awaiting PR
    if (outro) {
        magicString.append(outro);
    } // TODO TypeScript: Awaiting PR
    return magicString
        .trim() // TODO TypeScript: Awaiting PR
        .indent(indentString)
        .append(wrapperOutro)
        .prepend(wrapperIntro);
}