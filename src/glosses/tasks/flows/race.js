/**
 * This flow run the tasks in parallel, and returns the result of first completed task or throw if task is rejected.
 */
export default class RaceFlow extends adone.task.Flow {
    async _run() {
        const promises = [];
        
        await this._iterate((observer) => {
            promises.push(observer.result);
        });

        return Promise.race(promises);
    }
}
