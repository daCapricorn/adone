const { is, Terminal } = adone;

const mask = (input, maskChar) => {
    input = String(input);
    maskChar = adone.is.string(maskChar) ? maskChar : "*";
    if (input.length === 0) {
        return "";
    }

    return new Array(input.length + 1).join(maskChar);
};

export default class PasswordPrompt extends Terminal.BasePrompt {
    /**
     * Start the Inquiry session
     * @param  {Function} cb      Callback when prompt is done
     * @return {this}
     */
    _run(cb) {
        this.done = cb;

        const events = this.observe();

        events.on("line", async (input) => {
            input = this.filterInput(input);
            const state = await this.validate(input);
            if (state.isValid === true) {
                events.destroy();
                return this.onEnd(state);
            }
            return this.onError(state);
        });

        if (this.opt.mask) {
            events.on("keypress", (event) => {
                this.onKeypress(event);
            });
        }

        // Init
        this.render();

        return this;
    }

    /**
     * Render the prompt to screen
     * @return {Prompt} self
     */
    render(error) {
        let message = this.getQuestion();
        let bottomContent = "";

        if (this.status === "answered") {
            message += this.opt.mask ? this.terminal.cyan(mask(this.answer, this.opt.mask)) : this.terminal.italic.dim("[hidden]");
        } else if (this.opt.mask) {
            message += mask(this.terminal.readline.line || "", this.opt.mask);
        } else {
            message += this.terminal.italic.dim("[input is hidden] ");
        }

        if (error) {
            bottomContent = `\n${this.terminal.red(">> ")}${error}`;
        }

        this.screen.render(message, bottomContent);
    }

    /**
     * When user press `enter` key
     */
    filterInput(input) {
        if (!input) {
            return is.nil(this.opt.default) ? "" : this.opt.default;
        }
        return input;
    }

    onEnd(state) {
        this.status = "answered";
        this.answer = state.value;

        // Re-render prompt
        this.render();

        this.screen.done();
        this.done(state.value);
    }

    onError(state) {
        this.render(state.isValid);
    }

    onKeypress() {
        this.render();
    }
}
