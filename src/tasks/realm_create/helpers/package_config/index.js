const {
    fs,
    configuration,
    std,
    util
} = adone;

const PACKAGE_PROPS = [
    "name",
    "description",
    "version",
    "author",
    "bin",
    "main",
    "license"
];

export const create = async ({ cwd, ...props } = {}) => {
    const configPath = std.path.join(cwd, configuration.Npm.configName);
    if (await fs.exists(configPath)) {
        throw new adone.error.ExistsException(`Package file '${configPath}' already exists`);
    }

    const config = new configuration.Npm({
        cwd
    });
    config.merge(util.pick(props, PACKAGE_PROPS));
    await config.save();
    return config;
};

export const load = async ({ cwd } = {}) => configuration.Npm.load({ cwd });
