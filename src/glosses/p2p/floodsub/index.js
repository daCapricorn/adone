const TimeCache = require("time-cache");
const assert = require("assert");

const utils = require("./utils");
const config = require("./config");

const {
    p2p: { PubsubBaseProtocol },
    stream: { pull2: pull }
} = adone;
const { lengthPrefixed: lp } = pull;

const { message } = PubsubBaseProtocol;

const multicodec = config.multicodec;
const ensureArray = utils.ensureArray;
const setImmediate = require("async/setImmediate");

/**
 * FloodSub (aka dumbsub is an implementation of pubsub focused on
 * delivering an API for Publish/Subscribe, but with no CastTree Forming
 * (it just floods the network).
 */
class FloodSub extends PubsubBaseProtocol {
    /**
     * @param {Object} libp2p
     * @constructor
     */
    constructor(libp2p) {
        super("libp2p:floodsub", multicodec, libp2p);

        /**
         * Time based cache for sequence numbers.
         *
         * @type {TimeCache}
         */
        this.cache = new TimeCache();

        /**
         * List of our subscriptions
         * @type {Set<string>}
         */
        this.subscriptions = new Set();
    }

    /**
     * Dial a received peer.
     * @override
     * @param {PeerInfo} peerInfo peer info
     * @param {Connection} conn connection to the peer
     * @param {function} callback
     */
    _onDial(peerInfo, conn, callback) {
        super._onDial(peerInfo, conn, (err) => {
            if (err) {
                return callback(err);
            }
            const idB58Str = peerInfo.id.toB58String();
            const peer = this.peers.get(idB58Str);
            if (peer && peer.isWritable) {
                // Immediately send my own subscriptions to the newly established conn
                peer.sendSubscriptions(this.subscriptions);
            }
            setImmediate(() => callback());
        });
    }

    /**
     * Overriding the implementation of _processConnection should keep the connection and is
     * responsible for processing each RPC message received by other peers.
     * @override
     * @param {string} idB58Str peer id string in base58
     * @param {Connection} conn connection
     * @param {PeerInfo} peer peer info
     * @returns {undefined}
     *
     */
    _processConnection(idB58Str, conn, peer) {
        pull(
            conn,
            lp.decode(),
            pull.map((data) => message.rpc.RPC.decode(data)),
            pull.drain(
                (rpc) => this._onRpc(idB58Str, rpc),
                (err) => this._onConnectionEnd(idB58Str, peer, err)
            )
        );
    }

    _onRpc(idB58Str, rpc) {
        if (!rpc) {
            return;
        }

        this.log("rpc from", idB58Str);
        const subs = rpc.subscriptions;
        const msgs = rpc.msgs;

        if (msgs && msgs.length) {
            this._processRpcMessages(utils.normalizeInRpcMessages(rpc.msgs));
        }

        if (subs && subs.length) {
            const peer = this.peers.get(idB58Str);
            if (peer) {
                peer.updateSubscriptions(subs);
                this.emit("floodsub:subscription-change", peer.info, peer.topics, subs);
            }
        }
    }

    _processRpcMessages(msgs) {
        msgs.forEach((msg) => {
            const seqno = utils.msgId(msg.from, msg.seqno);
            // 1. check if I've seen the message, if yes, ignore
            if (this.cache.has(seqno)) {
                return;
            }

            this.cache.put(seqno);

            // 2. emit to self
            this._emitMessages(msg.topicIDs, [msg]);

            // 3. propagate msg to others
            this._forwardMessages(msg.topicIDs, [msg]);
        });
    }

    _emitMessages(topics, messages) {
        topics.forEach((topic) => {
            if (!this.subscriptions.has(topic)) {
                return;
            }

            messages.forEach((message) => {
                this.emit(topic, message);
            });
        });
    }

    _forwardMessages(topics, messages) {
        this.peers.forEach((peer) => {
            if (!peer.isWritable || !utils.anyMatch(peer.topics, topics)) {
                return;
            }

            peer.sendMessages(utils.normalizeOutRpcMessages(messages));

            this.log("publish msgs on topics", topics, peer.info.id.toB58String());
        });
    }

    /**
     * Unmounts the floodsub protocol and shuts down every connection
     * @override
     * @param {Function} callback
     * @returns {undefined}
     *
     */
    stop(callback) {
        super.stop((err) => {
            if (err) {
                return callback(err);
            }
            this.subscriptions = new Set();
            callback();
        });
    }

    /**
     * Publish messages to the given topics.
     * @override
     * @param {Array<string>|string} topics
     * @param {Array<any>|any} messages
     * @returns {undefined}
     *
     */
    publish(topics, messages) {
        assert(this.started, "FloodSub is not started");

        this.log("publish", topics, messages);

        topics = ensureArray(topics);
        messages = ensureArray(messages);

        const from = this.libp2p.peerInfo.id.toB58String();

        const buildMessage = (msg) => {
            const seqno = utils.randomSeqno();
            this.cache.put(utils.msgId(from, seqno));

            return {
                from,
                data: msg,
                seqno,
                topicIDs: topics
            };
        };

        const msgObjects = messages.map(buildMessage);

        // Emit to self if I'm interested
        this._emitMessages(topics, msgObjects);

        // send to all the other peers
        this._forwardMessages(topics, msgObjects);
    }

    /**
     * Subscribe to the given topic(s).
     * @override
     * @param {Array<string>|string} topics
     * @returns {undefined}
     */
    subscribe(topics) {
        assert(this.started, "FloodSub is not started");

        topics = ensureArray(topics);

        topics.forEach((topic) => this.subscriptions.add(topic));

        this.peers.forEach((peer) => sendSubscriptionsOnceReady(peer));
        // make sure that FloodSub is already mounted
        function sendSubscriptionsOnceReady(peer) {
            if (peer && peer.isWritable) {
                return peer.sendSubscriptions(topics);
            }
            const onConnection = () => {
                peer.removeListener("connection", onConnection);
                sendSubscriptionsOnceReady(peer);
            };
            peer.on("connection", onConnection);
            peer.once("close", () => peer.removeListener("connection", onConnection));
        }
    }

    /**
     * Unsubscribe from the given topic(s).
     * @override
     * @param {Array<string>|string} topics
     * @returns {undefined}
     */
    unsubscribe(topics) {
        // Avoid race conditions, by quietly ignoring unsub when shutdown.
        if (!this.started) {
            return;
        }

        topics = ensureArray(topics);

        topics.forEach((topic) => this.subscriptions.delete(topic));

        this.peers.forEach((peer) => checkIfReady(peer));
        // make sure that FloodSub is already mounted
        function checkIfReady(peer) {
            if (peer && peer.isWritable) {
                peer.sendUnsubscriptions(topics);
            } else {
                setImmediate(checkIfReady.bind(peer));
            }
        }
    }
}

module.exports = FloodSub;