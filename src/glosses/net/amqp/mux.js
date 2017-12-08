const {
    is,
    std: { assert }
} = adone;

// A Mux is an object into which other readable streams may be piped;
// it then writes 'packets' from the upstreams to the given
// downstream.

// There are 2 states we can be in:

// - waiting for outbound capacity, which will be signalled by a
// - 'drain' event on the downstream; or,

// - no packets to send, waiting for an inbound buffer to have
//   packets, which will be signalled by a 'readable' event

// If we write all packets available whenever there is outbound
// capacity, we will either run out of outbound capacity (`#write`
// returns false), or run out of packets (all calls to an
// `inbound.read()` have returned null).

export default class Mux {
    constructor(downstream) {
        this.newStreams = [];
        this.oldStreams = [];
        this.blocked = false;
        this.scheduledRead = false;

        this.out = downstream;
        const self = this;
        downstream.on("drain", () => {
            self.blocked = false;
            self._readIncoming();
        });
    }

    _readIncoming() {

        // We may be sent here speculatively, if an incoming stream has
        // become readable
        if (this.blocked) {
            return;
        }

        let accepting = true;
        const out = this.out;

        // Try to read a chunk from each stream in turn, until all streams
        // are empty, or we exhaust our ability to accept chunks.
        const roundrobin = (streams) => {
            let s;
            // if there's just one incoming stream we don't have to
            // go through all the dequeue/enqueueing
            if (streams.length === 1) {
                s = streams.shift();
                while (accepting) {
                    const chunk = s.read();
                    if (!is.null(chunk)) {
                        accepting = out.write(chunk);
                    } else {
                        break;
                    }
                }
                if (!accepting) {
                    streams.push(s);
                }
            } else {
                while (accepting && (s = streams.shift())) {
                    const chunk = s.read();
                    if (!is.null(chunk)) {
                        accepting = out.write(chunk);
                        streams.push(s);
                    }
                }
            }
        };

        roundrobin(this.newStreams);

        // Either we exhausted the new queues, or we ran out of capacity. If
        // we ran out of capacity, all the remaining new streams (i.e.,
        // those with packets left) become old streams. This effectively
        // prioritises streams that keep their buffers close to empty over
        // those that are constantly near full.

        if (accepting) { // all new queues are exhausted, write as many as
            // we can from the old streams
            assert.equal(0, this.newStreams.length);
            roundrobin(this.oldStreams);
        } else { // ran out of room
            assert(this.newStreams.length > 0, "Expect some new streams to remain");
            this.oldStreams = this.oldStreams.concat(this.newStreams);
            this.newStreams = [];
        }
        // We may have exhausted all the old queues, or run out of room;
        // either way, all we need to do is record whether we have capacity
        // or not, so any speculative reads will know
        this.blocked = !accepting;
    }

    _scheduleRead() {
        const self = this;

        if (!self.scheduledRead) {
            process.nextTick(() => {
                self.scheduledRead = false;
                self._readIncoming();
            });
            self.scheduledRead = true;
        }
    }

    pipeFrom(readable) {
        const self = this;

        const enqueue = () => {
            self.newStreams.push(readable);
            self._scheduleRead();
        };

        const cleanup = () => {
            readable.removeListener("readable", enqueue);
            readable.removeListener("error", cleanup);
            readable.removeListener("end", cleanup);
            readable.removeListener("unpipeFrom", cleanupIfMe); // eslint-disable-line
        };

        const cleanupIfMe = (dest) => {
            if (dest === self) {
                cleanup();
            }
        };

        readable.on("unpipeFrom", cleanupIfMe);
        readable.on("end", cleanup);
        readable.on("error", cleanup);
        readable.on("readable", enqueue);
    }

    unpipeFrom(readable) {
        readable.emit("unpipeFrom", this);
    }
}
