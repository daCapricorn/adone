import { Node } from 'estree';

export default function isReference (node: Node, parent: Node): boolean {
	if (node.type === 'MemberExpression') {
		return !node.computed && isReference(node.object, node);
	}

	if (node.type === 'Identifier') {
		if (!parent) {
			return true;
		}

		switch (parent.type) {
			// disregard `bar` in `foo.bar`
			case 'MemberExpression': return parent.computed || node === parent.object;

			// disregard the `foo` in `class {foo(){}}` but keep it in `class {[foo](){}}`
			case 'MethodDefinition': return parent.computed;

			// disregard the `bar` in `{ bar: foo }`, but keep it in `{ [bar]: foo }`
			case 'Property': return parent.computed || node === parent.value;

			// disregard the `bar` in `export { foo as bar }`
			case 'ExportSpecifier': return node === parent.local;

			// disregard the `foo` in `foo: while (...) { ... break foo; ... continue foo;}`
			case 'LabeledStatement':
			case 'BreakStatement':
			case 'ContinueStatement': return false;
			default: return true;
		}
	}

	return false;
}
