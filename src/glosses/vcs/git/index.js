const native = adone.bind("git.node");

// const _Indexer = rawApi.Indexer;
// const _Libgit2 = rawApi.Libgit2;

// const _Oidarray = rawApi.Oidarray;
// const _Openssl = rawApi.Openssl;

// const _Proxy = rawApi.Proxy;
// const _Push = rawApi.Push;
// const _Refdb = rawApi.Refdb;

// const _Refdb_open = _Refdb.open;
// _Refdb.open = adone.promise.promisifyAll(_Refdb_open);

// const _ReflogEntry = rawApi.ReflogEntry;
// const _Refspec = rawApi.Refspec;

// const _Strarray = rawApi.Strarray;
// const _Time = rawApi.Time;
// const _Transport = rawApi.Transport;

// const _Transport_sshWithPaths = _Transport.sshWithPaths;
// _Transport.sshWithPaths = adone.promise.promisifyAll(_Transport_sshWithPaths);


// rawApi.DiffBinary.DIFF_BINARY = {
//     NONE: 0,
//     LITERAL: 1,
//     DELTA: 2
// };

// rawApi.Hashsig.OPTION = {
//     NORMAL: 0,
//     IGNORE_WHITESPACE: 1,
//     SMART_WHITESPACE: 2,
//     ALLOW_SMALL_FILES: 4
// };
// rawApi.Libgit2.OPT = {
//     GET_MWINDOW_SIZE: 0,
//     SET_MWINDOW_SIZE: 1,
//     GET_MWINDOW_MAPPED_LIMIT: 2,
//     SET_MWINDOW_MAPPED_LIMIT: 3,
//     GET_SEARCH_PATH: 4,
//     SET_SEARCH_PATH: 5,
//     SET_CACHE_OBJECT_LIMIT: 6,
//     SET_CACHE_MAX_SIZE: 7,
//     ENABLE_CACHING: 8,
//     GET_CACHED_MEMORY: 9,
//     GET_TEMPLATE_PATH: 10,
//     SET_TEMPLATE_PATH: 11,
//     SET_SSL_CERT_LOCATIONS: 12,
//     SET_USER_AGENT: 13,
//     ENABLE_STRICT_OBJECT_CREATION: 14,
//     ENABLE_STRICT_SYMBOLIC_REF_CREATION: 15,
//     SET_SSL_CIPHERS: 16,
//     GET_USER_AGENT: 17
// };
// rawApi.Proxy.PROXY = {
//     NONE: 0,
//     AUTO: 1,
//     SPECIFIED: 2
// };
// rawApi.Trace.LEVEL = {
//     NONE: 0,
//     FATAL: 1,
//     ERROR: 2,
//     WARN: 3,
//     INFO: 4,
//     DEBUG: 5,
//     TRACE: 6
// };
// rawApi.Transport.FLAGS = {
//     NONE: 0
// };

exports.Enums = {
    CVAR: {
        FALSE: 0,
        TRUE: 1,
        INT32: 2,
        STRING: 3
    },
    DIRECTION: {
        FETCH: 0,
        PUSH: 1
    },
    FEATURE: {
        THREADS: 1,
        HTTPS: 2,
        SSH: 4,
        NSEC: 8
    },
    IDXENTRY_EXTENDED_FLAG: {
        IDXENTRY_INTENT_TO_ADD: 8192,
        IDXENTRY_SKIP_WORKTREE: 16384,
        IDXENTRY_EXTENDED2: 32768,
        S: 24576,
        IDXENTRY_UPDATE: 1,
        IDXENTRY_REMOVE: 2,
        IDXENTRY_UPTODATE: 4,
        IDXENTRY_ADDED: 8,
        IDXENTRY_HASHED: 16,
        IDXENTRY_UNHASHED: 32,
        IDXENTRY_WT_REMOVE: 64,
        IDXENTRY_CONFLICTED: 128,
        IDXENTRY_UNPACKED: 256,
        IDXENTRY_NEW_SKIP_WORKTREE: 512
    },
    INDXENTRY_FLAG: {
        IDXENTRY_EXTENDED: 16384,
        IDXENTRY_VALID: 32768
    }
};

exports.Cert = {
    TYPE: {
        NONE: 0,
        X509: 1,
        HOSTKEY_LIBSSH2: 2,
        STRARRAY: 3
    },
    SSH: {
        MD5: 1,
        SHA1: 2
    }
};

exports.RebaseOperation = {
    REBASE_OPERATION: {
        PICK: 0,
        REWORD: 1,
        EDIT: 2,
        SQUASH: 3,
        FIXUP: 4,
        EXEC: 5
    }
};

exports.Error = {
    ERROR: {
        GITERR_NONE: 0,
        GITERR_NOMEMORY: 1,
        GITERR_OS: 2,
        GITERR_INVALID: 3,
        GITERR_REFERENCE: 4,
        GITERR_ZLIB: 5,
        GITERR_REPOSITORY: 6,
        GITERR_CONFIG: 7,
        GITERR_REGEX: 8,
        GITERR_ODB: 9,
        GITERR_INDEX: 10,
        GITERR_OBJECT: 11,
        GITERR_NET: 12,
        GITERR_TAG: 13,
        GITERR_TREE: 14,
        GITERR_INDEXER: 15,
        GITERR_SSL: 16,
        GITERR_SUBMODULE: 17,
        GITERR_THREAD: 18,
        GITERR_STASH: 19,
        GITERR_CHECKOUT: 20,
        GITERR_FETCHHEAD: 21,
        GITERR_MERGE: 22,
        GITERR_SSH: 23,
        GITERR_FILTER: 24,
        GITERR_REVERT: 25,
        GITERR_CALLBACK: 26,
        GITERR_CHERRYPICK: 27,
        GITERR_DESCRIBE: 28,
        GITERR_REBASE: 29,
        GITERR_FILESYSTEM: 30,
        GITERR_PATCH: 31
    },
    CODE: {
        OK: 0,
        ERROR: -1,
        ENOTFOUND: -3,
        EEXISTS: -4,
        EAMBIGUOUS: -5,
        EBUFS: -6,
        EUSER: -7,
        EBAREREPO: -8,
        EUNBORNBRANCH: -9,
        EUNMERGED: -10,
        ENONFASTFORWARD: -11,
        EINVALIDSPEC: -12,
        ECONFLICT: -13,
        ELOCKED: -14,
        EMODIFIED: -15,
        EAUTH: -16,
        ECERTIFICATE: -17,
        EAPPLIED: -18,
        EPEEL: -19,
        EEOF: -20,
        EINVALID: -21,
        EUNCOMMITTED: -22,
        EDIRECTORY: -23,
        EMERGECONFLICT: -24,
        PASSTHROUGH: -30,
        ITEROVER: -31
    }
};

adone.lazify({
    AnnotatedCommit: "./annotated_commit",
    Attr: "./attr",
    Blame: "./blame",
    Blob: "./blob",
    Branch: "./branch",
    Buf: "./buf",
    Checkout: "./checkout",
    Cherrypick: "./cherrypick",
    Clone: "./clone",
    Commit: "./commit",
    Config: "./config",
    ConvenientHunk: "./convenient_hunks",
    ConvenientPatch: "./convenient_patch",
    Cred: "./cred",
    Diff: "./diff",
    DiffFile: "./diff_file",
    DiffLine: "./diff_line",
    Fetch: "./fetch",
    Filter: "./filter",
    FilterRegistry: "./filter_registry",
    Graph: "./graph",
    Hashing: "./hashing",
    Ignore: "./ignore",
    Index: "./git_index",
    Merge: "./merge",
    Note: "./note",
    Object: "./object",
    Odb: "./odb",
    OdbObject: "./odb_object",
    Oid: "./oid",
    Packbuilder: "./packbuilder",
    Patch: "./patch",
    Pathspec: "./pathspec",
    Rebase: "./rebase",
    Reference: "./reference",
    Reflog: "./reflog",
    Remote: "./remote",
    Repository: "./repository",
    Reset: "./reset",
    Revert: "./revert",
    Revparse: "./revparse",
    Revwalk: "./revwalk",
    Signature: "./signature",
    Stash: "./stash",
    Status: "./status",
    StatusFile: "./status_file",
    StatusList: "./status_list",
    Submodule: "./submodule",
    Tag: "./tag",
    Tree: "./tree",
    TreeBuilder: "./tree_builder",
    TreeEntry: "./tree_entry",
    Utils: () => adone.lazify({
        lookupWrapper: "./utils/lookup_wrapper",
        normalizeOptions: "./utils/normalize_options",
        shallowClone: "./utils/shallow_clone",
        normalizeFetchOptions: "./utils/normalize_fetch_options"
    }, null, require)
}, exports, require);

// additional api
exports.Treebuilder = native.Treebuilder;
exports.FilterSource = native.FilterSource;
exports.Giterr = native.Giterr;
exports.PushOptions = native.PushOptions;
exports.MergeOptions = native.MergeOptions;
exports.FetchOptions = native.FetchOptions;
exports.RemoteCallbacks = native.RemoteCallbacks;
exports.ProxyOptions = native.ProxyOptions;
exports.CloneOptions = native.CloneOptions;
exports.DiffOptions = native.DiffOptions;
exports.DiffFindOptions = native.DiffFindOptions;
exports.CheckoutOptions = native.CheckoutOptions;
exports.CherrypickOptions = native.CherrypickOptions;
exports.RepositoryInitOptions = native.RepositoryInitOptions;
exports.StatusOptions = native.StatusOptions;
exports.BlameOptions = native.BlameOptions;
exports.StashApplyOptions = native.StashApplyOptions;
exports.RebaseOptions = native.RebaseOptions;
exports.RevertOptions = native.RevertOptions;
exports.SubmoduleUpdateOptions = native.SubmoduleUpdateOptions;
exports.getThreadSafetyStatus = native.getThreadSafetyStatus;
exports.enableThreadSafety = native.enableThreadSafety;
exports.setThreadSafetyStatus = native.setThreadSafetyStatus;
exports.getThreadSafetyDiagnostics = native.getThreadSafetyDiagnostics;
exports.THREAD_SAFETY = native.THREAD_SAFETY;