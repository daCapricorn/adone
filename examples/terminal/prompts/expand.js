adone.run({
    main() {
        adone.terminal.prompt().run([
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
                    adone.terminal.separator(),
                    {
                        key: "x",
                        name: "Abort",
                        value: "abort"
                    }
                ]
            }
        ]).then((answers) => {
            adone.log(JSON.stringify(answers, null, "  "));
        });

    }
});
