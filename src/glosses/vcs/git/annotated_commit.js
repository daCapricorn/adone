const native = adone.bind("git.node");

const {
    promise: { promisifyAll }
} = adone;

const AnnotatedCommit = native.AnnotatedCommit;

AnnotatedCommit.fromFetchhead = promisifyAll(AnnotatedCommit.fromFetchhead);
AnnotatedCommit.fromRef = promisifyAll(AnnotatedCommit.fromRef);
AnnotatedCommit.fromRevspec = promisifyAll(AnnotatedCommit.fromRevspec);
AnnotatedCommit.lookup = promisifyAll(AnnotatedCommit.lookup);

export default AnnotatedCommit;
