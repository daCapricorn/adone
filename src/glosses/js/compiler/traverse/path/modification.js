// This file contains methods that modify the path/node in some ways.

import { path as pathCache } from "../cache";
import PathHoister from "./lib/hoister";
import NodePath from "./index";

const {
    is,
    js: { compiler: { types: t } }
} = adone;

/**
 * Insert the provided nodes before the current one.
 */

export function insertBefore(nodes) {
    this._assertUnremoved();

    nodes = this._verifyNodeList(nodes);

    if (
        this.parentPath.isExpressionStatement() ||
        this.parentPath.isLabeledStatement()
    ) {
        return this.parentPath.insertBefore(nodes);
    } else if (
        (this.isNodeType("Expression") &&
            this.listKey !== "params" &&
            this.listKey !== "arguments") ||
        (this.parentPath.isForStatement() && this.key === "init")
    ) {
        if (this.node) { nodes.push(this.node); }
        return this.replaceExpressionWithStatements(nodes);
    } else if (is.array(this.container)) {
        return this._containerInsertBefore(nodes);
    } else if (this.isStatementOrBlock()) {
        const shouldInsertCurrentNode =
            this.node &&
            (!this.isExpressionStatement() || !is.nil(this.node.expression));

        this.replaceWith(
            t.blockStatement(shouldInsertCurrentNode ? [this.node] : []),
        );
        return this.unshiftContainer("body", nodes);
    }
    throw new Error(
        "We don't know what to do with this node type. " +
        "We were previously a Statement but we can't fit in here?",
    );

}

export function _containerInsert(from, nodes) {
    this.updateSiblingKeys(from, nodes.length);

    const paths = [];

    this.container.splice(from, 0, ...nodes);
    for (let i = 0; i < nodes.length; i++) {
        const to = from + i;
        const path = this.getSibling(`${to}`);
        paths.push(path);

        if (this.context && this.context.queue) {
            path.pushContext(this.context);
        }
    }

    const contexts = this._getQueueContexts();

    for (const path of paths) {
        path.setScope();

        for (const context of contexts) {
            context.maybeQueue(path, true);
        }
    }

    return paths;
}

export function _containerInsertBefore(nodes) {
    return this._containerInsert(this.key, nodes);
}

export function _containerInsertAfter(nodes) {
    return this._containerInsert(this.key + 1, nodes);
}

/**
 * Insert the provided nodes after the current one. When inserting nodes after an
 * expression, ensure that the completion record is correct by pushing the current node.
 */

export function insertAfter(nodes) {
    this._assertUnremoved();

    nodes = this._verifyNodeList(nodes);

    if (
        this.parentPath.isExpressionStatement() ||
        this.parentPath.isLabeledStatement()
    ) {
        return this.parentPath.insertAfter(nodes);
    } else if (
        this.isNodeType("Expression") ||
        (this.parentPath.isForStatement() && this.key === "init")
    ) {
        if (this.node) {
            const temp = this.scope.generateDeclaredUidIdentifier();
            nodes.unshift(
                t.expressionStatement(t.assignmentExpression("=", temp, this.node)),
            );
            nodes.push(t.expressionStatement(temp));
        }
        return this.replaceExpressionWithStatements(nodes);
    } else if (is.array(this.container)) {
        return this._containerInsertAfter(nodes);
    } else if (this.isStatementOrBlock()) {
        const shouldInsertCurrentNode =
            this.node &&
            (!this.isExpressionStatement() || !is.nil(this.node.expression));

        this.replaceWith(
            t.blockStatement(shouldInsertCurrentNode ? [this.node] : []),
        );
        return this.pushContainer("body", nodes);
    }
    throw new Error(
        "We don't know what to do with this node type. " +
        "We were previously a Statement but we can't fit in here?",
    );

}

/**
 * Update all sibling node paths after `fromIndex` by `incrementBy`.
 */

export function updateSiblingKeys(fromIndex, incrementBy) {
    if (!this.parent) {
        return;
    }

    const paths = pathCache.get(this.parent);
    for (let i = 0; i < paths.length; i++) {
        const path = paths[i];
        if (path.key >= fromIndex) {
            path.key += incrementBy;
        }
    }
}

export function _verifyNodeList(nodes) {
    if (!nodes) {
        return [];
    }

    if (nodes.constructor !== Array) {
        nodes = [nodes];
    }

    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        let msg;

        if (!node) {
            msg = "has falsy node";
        } else if (typeof node !== "object") {
            msg = "contains a non-object node";
        } else if (!node.type) {
            msg = "without a type";
        } else if (node instanceof NodePath) {
            msg = "has a NodePath when it expected a raw object";
        }

        if (msg) {
            const type = is.array(node) ? "array" : typeof node;
            throw new Error(
                `Node list ${msg} with the index of ${i} and type of ${type}`,
            );
        }
    }

    return nodes;
}

export function unshiftContainer(listKey, nodes) {
    this._assertUnremoved();

    nodes = this._verifyNodeList(nodes);

    // get the first path and insert our nodes before it, if it doesn't exist then it
    // doesn't matter, our nodes will be inserted anyway
    const path = NodePath.get({
        parentPath: this,
        parent: this.node,
        container: this.node[listKey],
        listKey,
        key: 0
    });

    return path.insertBefore(nodes);
}

export function pushContainer(listKey, nodes) {
    this._assertUnremoved();

    nodes = this._verifyNodeList(nodes);

    // get an invisible path that represents the last node + 1 and replace it with our
    // nodes, effectively inlining it

    const container = this.node[listKey];
    const path = NodePath.get({
        parentPath: this,
        parent: this.node,
        container,
        listKey,
        key: container.length
    });

    return path.replaceWithMultiple(nodes);
}

/**
 * Hoist the current node to the highest scope possible and return a UID
 * referencing it.
 */

export function hoist(scope = this.scope) {
    const hoister = new PathHoister(this, scope);
    return hoister.run();
}
