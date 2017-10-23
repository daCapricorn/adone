const {
    x,
    is,
    application: {
        Subsystem,
        CliApplication
    }
} = adone;

const {
    Command
} = CliApplication;

const parseNumber = (str) => {
    if (!is.numeral(str)) {
        throw new x.InvalidArgument("Argument must be a real number");
    }
    return Number(str);
};

export default class Complex extends Subsystem {
    @Command({
        name: "add",
        description: "Adds two real numbers",
        arguments: [{
            name: "a",
            type: parseNumber,
            description: "first real number"
        }, {
            name: "b",
            type: parseNumber,
            description: "second real number"
        }]
    })
    add(args) {
        adone.log(args.get("a") + args.get("b"));
    }

    @Command({
        name: "sub",
        description: "Subtracts two real numbers",
        arguments: [{
            name: "a",
            type: parseNumber,
            description: "first real number"
        }, {
            name: "b",
            type: parseNumber,
            description: "second real number"
        }]
    })
    sub(args) {
        adone.log(args.get("a") - args.get("b"));
    }

    @Command({
        name: "mul",
        description: "Multiplies two real numbers",
        arguments: [{
            name: "a",
            type: parseNumber,
            description: "first real number"
        }, {
            name: "b",
            type: parseNumber,
            description: "second real number"
        }]
    })
    mul(args) {
        adone.log(args.get("a") * args.get("b"));
    }

    @Command({
        name: "div",
        description: "Divides two real numbers",
        arguments: [{
            name: "a",
            type: parseNumber,
            description: "first real number"
        }, {
            name: "b",
            type: parseNumber,
            description: "second real number"
        }]
    })
    div(args) {
        const b = args.get("b");
        if (b === 0) {
            adone.error("division by zero");
            return 1;
        }
        adone.log(args.get("a") / b);
    }
}