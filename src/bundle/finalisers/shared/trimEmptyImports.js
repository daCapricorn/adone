export default function trimEmptyImports(dependencies) {
    let i = dependencies.length;
    while (i--) {
        const dependency = dependencies[i];
        if (dependency.exportsDefault || dependency.exportsNames) {
            return dependencies.slice(0, i + 1);
        }
    }
    return [];
}
