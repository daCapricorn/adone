adone.app.run({
    async main() {
        const answers = await adone.runtime.term.prompt().run([
            {
                type: "expand",
                message: "Conflict on `file.js`: ",
                name: "overwrite",
                choices: [
                    {
                        key: "y",
                        name: "Overwrite",
                        value: "overwrite"
                    },
                    {
                        key: "a",
                        name: "Overwrite this one and all next",
                        value: "overwrite_all"
                    },
                    {
                        key: "d",
                        name: "Show diff",
                        value: "diff"
                    },
                    adone.runtime.term.separator(),
                    {
                        key: "x",
                        name: "Abort",
                        value: "abort"
                    }
                ]
            }
        ]);
        console.log(JSON.stringify(answers, null, "  "));
    }
});
