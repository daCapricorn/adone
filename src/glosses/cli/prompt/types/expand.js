const {
    is,
    lodash: _,
    cli: { chalk, prompt: { BasePrompt, Choices, Paginator, Separator } }
} = adone;

/**
 * Function for rendering checkbox choices
 * @param  {String} pointer Selected key
 * @return {String}         Rendered content
 */
const renderChoices = (terminal, choices, pointer) => {
    let output = "";

    choices.forEach((choice) => {
        output += "\n  ";

        if (choice.type === "separator") {
            output += ` ${choice}`;
            return;
        }

        let choiceStr = `${choice.key}) ${choice.name}`;
        if (pointer === choice.key) {
            choiceStr = chalk.cyan(choiceStr);
        }
        output += choiceStr;
    });

    return output;
};

export default class ExpandPrompt extends BasePrompt {
    constructor(manager, question, answers) {
        super(manager, question, answers);
        if (!this.opt.choices) {
            this.throwParamError("choices");
        }
        this.choices = new Choices(this.term, this.opt.choices, answers);

        this.validateChoices(this.choices);

        // Add the default `help` (/expand) option
        this.choices.push({
            key: "h",
            name: "Help, list all options",
            value: "help"
        });

        this.opt.validate = (choice) => {
            if (is.nil(choice)) {
                return "Please enter a valid command";
            }

            return choice !== "help";
        };

        // Setup the default string (capitalize the default key)
        this.opt.default = this.generateChoicesString(this.choices, this.opt.default);

        this.paginator = new Paginator(this.term, this.screen);
    }

    /**
     * Start the Inquiry session
     * @param  {Function} cb      Callback when prompt is done
     * @return {this}
     */
    _run(cb) {
        this.done = cb;

        // Save user answer and update prompt to show selected option.
        const events = this.observe();

        events.on("line", async (input) => {
            const value = this.getCurrentValue(input);
            const state = await this.validate(value);
            if (state.isValid === true) {
                events.destroy();
                return this.onSubmit(state);
            }
            return this.onError(state);
        }).on("keypress", (event) => {
            this.onKeypress(event);
        });

        // Init the prompt
        this.render();

        return this;
    }

    /**
     * Render the prompt to screen
     * @return {Prompt} self
     */
    render(error, hint) {
        let message = this.getQuestion();
        let bottomContent = "";

        if (this.status === "answered") {
            message += chalk.cyan(this.answer);
        } else if (this.status === "expanded") {
            const choicesStr = renderChoices(this.term, this.choices, this.selectedKey);
            message += this.paginator.paginate(choicesStr, this.selectedKey, this.opt.pageSize);
            message += "\n  Answer: ";
        }

        message += this.rl.line;

        if (error) {
            bottomContent = chalk.red(">> ") + error;
        }

        if (hint) {
            bottomContent = chalk.cyan(">> ") + hint;
        }

        this.screen.render(message, bottomContent);
    }

    getCurrentValue(input) {
        if (!input) {
            input = this.rawDefault;
        }
        const selected = this.choices.where({ key: input.toLowerCase().trim() })[0];
        if (!selected) {
            return null;
        }

        return selected.value;
    }

    /**
     * Generate the prompt choices string
     * @return {String}  Choices string
     */
    getChoices() {
        let output = "";

        this.choices.forEach((choice) => {
            output += "\n  ";

            if (choice.type === "separator") {
                output += ` ${choice}`;
                return;
            }

            let choiceStr = `${choice.key}) ${choice.name}`;
            if (this.selectedKey === choice.key) {
                choiceStr = chalk.cyan(choiceStr);
            }
            output += choiceStr;
        });

        return output;
    }

    onError(state) {
        if (state.value === "help") {
            this.selectedKey = "";
            this.status = "expanded";
            this.render();
            return;
        }
        this.render(state.isValid);
    }

    /**
     * When user press `enter` key
     */
    onSubmit(state) {
        this.status = "answered";
        const choice = this.choices.where({ value: state.value })[0];
        this.answer = choice.short || choice.name;

        // Re-render prompt
        this.render();
        this.screen.done();
        this.done(state.value);
    }

    /**
     * When user press a key
     */
    onKeypress() {
        this.selectedKey = this.rl.line.toLowerCase();
        const selected = this.choices.where({ key: this.selectedKey })[0];
        if (this.status === "expanded") {
            this.render();
        } else {
            this.render(null, selected ? selected.name : null);
        }
    }

    /**
     * Validate the choices
     * @param {Array} choices
     */
    validateChoices(choices) {
        let formatError;
        const errors = [];
        const keymap = {};
        choices.filter(Separator.exclude).forEach((choice) => {
            if (!choice.key || choice.key.length !== 1) {
                formatError = true;
            }
            if (keymap[choice.key]) {
                errors.push(choice.key);
            }
            keymap[choice.key] = true;
            choice.key = String(choice.key).toLowerCase();
        });

        if (formatError) {
            throw new Error("Format error: `key` param must be a single letter and is required.");
        }
        if (keymap.h) {
            throw new Error("Reserved key error: `key` param cannot be `h` - this value is reserved.");
        }
        if (errors.length) {
            throw new Error(`Duplicate key error: \`key\` param must be unique. Duplicates: ${
                _.uniq(errors).join(", ")}`);
        }
    }

    /**
     * Generate a string out of the choices keys
     * @param  {Array}  choices
     * @param  {Number} defaultIndex - the choice index to capitalize
     * @return {String} The rendered choices key string
     */
    generateChoicesString(choices, defaultChoice) {
        let defIndex = choices.realLength - 1;
        if (is.number(defaultChoice) && this.choices.getChoice(defaultChoice)) {
            defIndex = defaultChoice;
        } else if (is.string(defaultChoice)) {
            const index = choices.realChoices.findIndex(({ value }) => value === defaultChoice);
            defIndex = (index === -1 ? defIndex : index);
        }
        const defStr = this.choices.pluck("key");
        this.rawDefault = defStr[defIndex];
        defStr[defIndex] = String(defStr[defIndex]).toUpperCase();
        return defStr.join("");
    }
}