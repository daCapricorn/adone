// This file contains methods responsible for dealing with comments.
const {
    js: { compiler: { types: t } }
} = adone;

/**
 * Share comments amongst siblings.
 */

export function shareCommentsWithSiblings() {
    // NOTE: this assumes numbered keys
    if (typeof this.key === "string") return;

    const node = this.node;
    if (!node) return;

    const trailing = node.trailingComments;
    const leading = node.leadingComments;
    if (!trailing && !leading) return;

    const prev = this.getSibling(this.key - 1);
    const next = this.getSibling(this.key + 1);
    const hasPrev = Boolean(prev.node);
    const hasNext = Boolean(next.node);
    if (hasPrev && hasNext) {
    } else if (hasPrev) {
        prev.addComments("trailing", trailing);
    } else if (hasNext) {
        next.addComments("leading", leading);
    }
}

export function addComment(type: string, content: string, line?: boolean) {
    t.addComment(this.node, type, content, line);
}

/**
 * Give node `comments` of the specified `type`.
 */

export function addComments(type: string, comments: Array) {
    t.addComments(this.node, type, comments);
}
