adone.lazify({
    Readable: "./readable",
    buffer: () => adone.lazify({
        DEFAULT_INITIAL_SIZE: ["./buffer_stream", (mod) => mod.DEFAULT_INITIAL_SIZE],
        DEFAULT_INCREMENT_AMOUNT: ["./buffer_stream", (mod) => mod.DEFAULT_INCREMENT_AMOUNT],
        DEFAULT_FREQUENCY: ["./buffer_stream", (mod) => mod.DEFAULT_FREQUENCY],
        DEFAULT_CHUNK_SIZE: ["./buffer_stream", (mod) => mod.DEFAULT_CHUNK_SIZE],
        ReadableStream: ["./buffer_stream", (mod) => mod.ReadableStream],
        WritableStream: ["./buffer_stream", (mod) => mod.WritableStream]
    }, null, require),
    concat: "./concat",
    MuteStream: "./mute_stream",
    iconv: "./iconv",
    CountingStream: "./counting_stream",
    newlineCounter: "./newline_counter",
    as: "./as",
    base64: "./base64",
    LastNewline: "./last_newline",
    Duplexify: "./duplexify",
    eos: "./eos",
    shift: "./shift",
    through: "./through",
    replace: "./replace",
    core: "./core",
    AssertByteCountStream: "./assert_byte_count",
    pull: "./pull",
    pump: "./pump",
    CombinedStream: "./combined_stream",
    DelayedStream: "./delayed_stream",
    merge: "./merge",
    MultiStream: "./multi_stream"
}, adone.asNamespace(exports), require);
