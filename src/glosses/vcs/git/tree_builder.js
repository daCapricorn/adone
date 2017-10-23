const native = adone.bind("git.node");

const {
    promise: { promisifyAll }
} = adone;

const TreeBuilder = native.Treebuilder;

TreeBuilder.create = promisifyAll(TreeBuilder.create);

export default TreeBuilder;
