const {
    js: { compiler: { types: t, helper: { pluginUtils: { declare } } } }
} = adone;

export default declare((api) => {
    api.assertVersion(7);

    return {
        inherits: adone.js.compiler.plugin.syntax.exportNamespaceFrom,

        visitor: {
            ExportNamedDeclaration(path) {
                const { node, scope } = path;
                const { specifiers } = node;

                const index = t.isExportDefaultSpecifier(specifiers[0]) ? 1 : 0;
                if (!t.isExportNamespaceSpecifier(specifiers[index])) { return; }

                const nodes = [];

                if (index === 1) {
                    nodes.push(
                        t.exportNamedDeclaration(null, [specifiers.shift()], node.source),
                    );
                }

                const specifier = specifiers.shift();
                const { exported } = specifier;
                const uid = scope.generateUidIdentifier(exported.name);

                nodes.push(
                    t.importDeclaration(
                        [t.importNamespaceSpecifier(uid)],
                        t.cloneNode(node.source),
                    ),
                    t.exportNamedDeclaration(null, [
                        t.exportSpecifier(t.cloneNode(uid), exported)
                    ]),
                );

                if (node.specifiers.length >= 1) {
                    nodes.push(node);
                }

                path.replaceWithMultiple(nodes);
            }
        }
    };
});