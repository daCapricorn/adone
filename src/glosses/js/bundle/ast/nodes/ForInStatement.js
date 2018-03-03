import BlockScope from "../scopes/BlockScope";
import { StatementBase } from "./shared/Node";
import { NO_SEMICOLON } from "../../module";

export const isForInStatement = (node) => node.type === "ForInStatement";

export default class ForInStatement extends StatementBase {
    hasEffects(options) {
        return ((this.left &&
            (this.left.hasEffects(options) ||
                this.left.hasEffectsWhenAssignedAtPath([], options))) ||
            (this.right && this.right.hasEffects(options)) ||
            this.body.hasEffects(options.setIgnoreBreakStatements()));
    }

    initialiseChildren() {
        this.left.initialise(this.scope);
        this.right.initialise(this.scope.parent);
        this.body.initialiseAndReplaceScope
            ? this.body.initialiseAndReplaceScope(this.scope)
            : this.body.initialise(this.scope);
    }

    includeInBundle() {
        let addedNewNodes = super.includeInBundle();
        if (this.left.includeWithAllDeclaredVariables()) {
            addedNewNodes = true;
        }
        return addedNewNodes;
    }

    initialiseScope(parentScope) {
        this.scope = new BlockScope({ parent: parentScope });
    }

    render(code, options) {
        this.left.render(code, options, NO_SEMICOLON);
        this.right.render(code, options, NO_SEMICOLON);
        this.body.render(code, options);
    }
}