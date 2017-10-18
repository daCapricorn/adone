exports.default = class TestCommand extends adone.application.Subsystem {
    async configure() {
        await this.getInterface("cli").defineCommand(this, {
            handler: this.testCommand            
        });
    }

    testCommand() {
        adone.log("well done");
    }
};
