const pull = require("pull-stream");

function echo(protocol, conn) {
    pull(conn, conn);
}

module.exports = echo;
module.exports.multicodec = "/echo/1.0.0";
