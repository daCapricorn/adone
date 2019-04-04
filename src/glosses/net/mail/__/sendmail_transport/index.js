const { is, net: { mail: { __ } }, std: { childProcess: { spawn } } } = adone;

/**
 * Generates a Transport object for Sendmail
 *
 * Possible options can be the following:
 *
 *  * **path** optional path to sendmail binary
 *  * **newline** either 'windows' or 'unix'
 *  * **args** an array of arguments for the sendmail binary
 *
 * @constructor
 * @param {Object} optional config parameter for the AWS Sendmail service
 */
export default class SendmailTransport {
    constructor(options) {
        options = options || {};

        // use a reference to spawn for mocking purposes
        this._spawn = spawn;

        this.options = options || {};

        this.name = "Sendmail";
        // this.version = packageData.version;
        this.version = "x.x.x"; // TODO: adone version ?

        this.path = "sendmail";
        this.args = false;
        this.winbreak = false;

        this.logger = __.shared.getLogger(this.options, {
            component: this.options.component || "sendmail"
        });

        if (options) {
            if (is.string(options)) {
                this.path = options;
            } else if (is.object(options)) {
                if (options.path) {
                    this.path = options.path;
                }
                if (is.array(options.args)) {
                    this.args = options.args;
                }
                this.winbreak = ["win", "windows", "dos", "\r\n"].includes((options.newline || "").toString().toLowerCase());
            }
        }
    }

    /**
     * <p>Compiles a mailcomposer message and forwards it to handler that sends it.</p>
     *
     * @param {Object} emailMessage MailComposer object
     * @param {Function} callback Callback function to run when the sending is completed
     */
    send(mail, done) {
        // Sendmail strips this header line by itself
        mail.message.keepBcc = true;

        const envelope = mail.data.envelope || mail.message.getEnvelope();
        const messageId = mail.message.messageId();
        let args;
        let sendmail;
        let returned;
        let transform;

        if (this.args) {
            // force -i to keep single dots
            args = ["-i"].concat(this.args).concat(envelope.to);
        } else {
            args = ["-i"].concat(envelope.from ? ["-f", envelope.from] : []).concat(envelope.to);
        }

        const callback = (err) => {
            if (returned) {
                // ignore any additional responses, already done
                return;
            }
            returned = true;
            if (is.function(done)) {
                if (err) {
                    return done(err);
                }
                return done(null, {
                    envelope: mail.data.envelope || mail.message.getEnvelope(),
                    messageId,
                    response: "Messages queued for delivery"
                });

            }
        };

        try {
            sendmail = this._spawn(this.path, args);
        } catch (E) {
            this.logger.error({
                err: E,
                tnx: "spawn",
                messageId
            }, "Error occurred while spawning sendmail. %s", E.message);
            return callback(E);
        }

        if (sendmail) {
            sendmail.on("error", (err) => {
                this.logger.error({
                    err,
                    tnx: "spawn",
                    messageId
                }, "Error occurred when sending message %s. %s", messageId, err.message);
                callback(err);
            });

            sendmail.once("exit", (code) => {
                if (!code) {
                    return callback();
                }
                let err;
                if (code === 127) {
                    err = new Error(`Sendmail command not found, process exited with code ${code}`);
                } else {
                    err = new Error(`Sendmail exited with code ${code}`);
                }

                this.logger.error({
                    err,
                    tnx: "stdin",
                    messageId
                }, "Error sending message %s to sendmail. %s", messageId, err.message);
                callback(err);
            });
            sendmail.once("close", callback);

            sendmail.stdin.on("error", (err) => {
                this.logger.error({
                    err,
                    tnx: "stdin",
                    messageId
                }, "Error occurred when piping message %s to sendmail. %s", messageId, err.message);
                callback(err);
            });

            const recipients = [].concat(envelope.to || []);
            if (recipients.length > 3) {
                recipients.push(`...and ${recipients.splice(2).length} more`);
            }
            this.logger.info({
                tnx: "send",
                messageId
            }, "Sending message %s to <%s>", messageId, recipients.join(", "));

            transform = this.winbreak ? new __.LeWindows() : new __.LeUnix();
            const sourceStream = mail.message.createReadStream();

            transform.once("error", (err) => {
                this.logger.error({
                    err,
                    tnx: "stdin",
                    messageId
                }, "Error occurred when generating message %s. %s", messageId, err.message);
                sendmail.kill("SIGINT"); // do not deliver the message
                callback(err);
            });

            sourceStream.once("error", (err) => transform.emit("error", err));
            sourceStream.pipe(transform).pipe(sendmail.stdin);
        } else {
            return callback(new Error("sendmail was not found"));
        }

    }
}
