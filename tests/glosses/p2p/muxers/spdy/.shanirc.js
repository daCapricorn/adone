const {
    multiformat: { multiaddr },
    p2p: { muxer: { spdy }, transport: { WS } },
    stream: { pull2: pull }
} = adone;

export default (ctx) => {
    ctx.prefix("p2p", "muxer", "spdy");
    
    let listener;

    ctx.before((done) => {
        const ws = new WS();
        const mh = multiaddr("/ip4/127.0.0.1/tcp/9095/ws");
        listener = ws.createListener((transportSocket) => {
            const muxedConn = spdy.listener(transportSocket);
            muxedConn.on("stream", (connRx) => {
                const connTx = muxedConn.newStream();
                pull(connRx, connTx, connRx);
            });
        });

        listener.listen(mh, done);
    });

    ctx.after((done) => {
        listener.close(done);
    });
};
