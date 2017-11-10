const {
    is,
    project
} = adone;

const TEMPLATE =
`#!/usr/bin/env node

import "adone";

const {
    application
} = adone;

class {{ name }}Application extends application.Application {
    async configure() {

    }

    async initialize() {

    }

    async main() {

        return 0;
    }

    async uninitialize() {

    }
}

application.run({{ name }}Application);
`;

export default class ApplicationTask extends project.generator.task.Base {
    async run(input) {
        if (!is.string(input.name)) {
            throw new adone.x.NotValid("Name should be a valid string");
        }
        return project.generator.helper.createFile(TEMPLATE, input);
    }
}