#ifndef STREAM_ENCODE_WORKER_H
#define STREAM_ENCODE_WORKER_H

#include <nan.h>
#include "stream_encode.h"
#include "deps/enc/encode.h"

class StreamEncodeWorker : public Nan::AsyncWorker
{
  public:
    StreamEncodeWorker(Nan::Callback *callback, StreamEncode *obj, bool is_last, bool force_flush);

    void Execute();
    void HandleOKCallback();

  private:
    ~StreamEncodeWorker();
    StreamEncode *obj;

    bool is_last;
    bool force_flush;
    int res;
};

#endif