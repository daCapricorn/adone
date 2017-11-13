const {
    is,
    lazify
} = adone;

// Service statuses
export const STATUS = {
    INVALID: "invalid",
    DISABLED: "disabled",
    INACTIVE: "inactive",
    STARTING: "starting",
    ACTIVE: "active",
    STOPPING: "stopping"
};

// Possible statuses
export const STATUSES = [
    STATUS.INVALID,
    STATUS.DISABLED,
    STATUS.INACTIVE,
    STATUS.STARTING,
    STATUS.ACTIVE,
    STATUS.STOPPING
];

adone.definePredicates({
    omnitronService: "OMNITRON_SERVICE"
});

lazify({
    SystemDB: "./systemdb",
    Configuration: "./configuration",
    Service: "./service",
    Omnitron: "./omnitron",
    Dispatcher: "./dispatcher",
    dispatcher: () => new adone.omnitron.Dispatcher()
}, adone.asNamespace(exports), require);
