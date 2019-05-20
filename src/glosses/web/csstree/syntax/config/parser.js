module.exports = {
    parseContext: {
        default: 'StyleSheet',
        stylesheet: 'StyleSheet',
        atrule: 'Atrule',
        atruleExpression: function(options) {
            return this.AtruleExpression(options.atrule ? String(options.atrule) : null);
        },
        mediaQueryList: 'MediaQueryList',
        mediaQuery: 'MediaQuery',
        rule: 'Rule',
        selectorList: 'SelectorList',
        selector: 'Selector',
        block: function() {
            return this.Block(this.Declaration);
        },
        declarationList: 'DeclarationList',
        declaration: 'Declaration',
        value: function(options) {
            return this.Value(options.property ? String(options.property) : null);
        }
    },
    scope: require('../scope'),
    atrule: require('../atrule'),
    pseudo: require('../pseudo'),
    node: require('../node')
};
