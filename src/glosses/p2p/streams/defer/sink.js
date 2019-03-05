module.exports = function (stream) {
    let read; let started = false;

    function consume(_read) {
        if (!_read) {
            throw new Error("must be passed a readable"); 
        }
        read = _read;
        if (started) {
            stream(read); 
        }
    }

    consume.resolve =
  consume.ready =
  consume.start = function (_stream) {
      started = true; stream = _stream || stream;
      if (read) {
          stream(read); 
      }
      return consume;
  };

    return consume;
};
