const {
    task
} = adone;

export default class extends task.Task {
    async run() {
        await adone.promise.delay(10);
        adone.log(`adone v${adone.package.version}`);
    }
}