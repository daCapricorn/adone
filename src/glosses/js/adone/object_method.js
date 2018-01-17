export default class XObjectMethod extends adone.js.adone.Base {
    constructor(options) {
        super(options);
        this.name = this.ast.key.name;
    }

    getType() {
        return "ObjectMethod";
    }
}
adone.tag.define("CODEMOD_OBJECT_METHOD");
adone.tag.add(XObjectMethod, "CODEMOD_OBJECT_METHOD");
