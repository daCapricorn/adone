const { vendor, is, std: { path }, util } = adone;

const TEMPLATE_HEADER = "angular.module('<%= module %>'<%= standalone %>).run(['$templateCache', function($templateCache) {";
const TEMPLATE_BODY = "$templateCache.put('<%= url %>','<%= contents %>');";
const TEMPLATE_FOOTER = "}]);";

const DEFAULT_FILENAME = "templates.js";
const DEFAULT_MODULE = "templates";
const MODULE_TEMPLATES = {
    requirejs: "define(['angular'], function(angular) { 'use strict'; return <%= file.contents %>});",
    browserify: "'use strict'; module.exports = <%= file.contents %>",
    es6: "import angular from 'angular'; export default <%= file.contents %>",
    iife: "(function(){ <%= file.contents %> })();"
};

const processed = Symbol("processed");

export default function plugin() {
    return function angularTemplateCache(filename, options = {}) {
        if (!is.string(filename)) {
            options = filename || {};
            filename = options.filename || DEFAULT_FILENAME;
        }

        const templateHeader = options.templateHeader || TEMPLATE_HEADER;
        const templateFooter = options.templateFooter || TEMPLATE_FOOTER;

        const root = options.root || "";
        let base = options.base;
        const templateBody = options.templateBody;
        const transformUrl = options.transformUrl;

        if (!is.function(base) && base && !base.endsWith(path.sep)) {
            base += path.sep;
        }

        const template = vendor.lodash.template(templateBody || TEMPLATE_BODY);

        this.throughSync(function (file) {
            if (file[processed]) {
                this.push(file);
                return;
            }
            let url;

            file.path = path.normalize(file.path);

            if (is.function(base)) {
                url = path.join(root, base(file));
            } else {
                url = path.join(root, file.path.replace(base || file.base, ""));
            }

            if (root === "." || root.indexOf("./") === 0) {
                url = `./${url}`;
            }

            if (is.function(transformUrl)) {
                url = transformUrl(url);
            }

            url = util.unixifyPath(url);
            /**
             * Create buffer
             */
            file.contents = Buffer.from(template({
                url,
                contents: util.jsesc(file.contents.toString()),
                file
            }));

            file[processed] = true;

            this.push(file);
        });
        this.concat(filename);
        this.wrap(`${templateHeader}<%= file.contents %>`, {
            module: options.module || DEFAULT_MODULE,
            standalone: options.standalone ? ", []" : ""
        });
        this.wrap(`<%= file.contents %>${templateFooter}`, {
            module: options.module || DEFAULT_MODULE
        });
        if (options.moduleSystem) {
            const moduleTemplate = MODULE_TEMPLATES[options.moduleSystem.toLowerCase()];
            this.wrap(moduleTemplate);
        }
        return this;
    };
}