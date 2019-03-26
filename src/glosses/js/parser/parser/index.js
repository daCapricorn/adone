// @flow

const {
    is
} = adone;

import type { Options } from "../options";
import type { File, JSXOpeningElement } from "../types";
import type { PluginList } from "../plugin-utils";
import { getOptions } from "../options";
import StatementParser from "./statement";
import { SCOPE_PROGRAM } from "../util/scopeflags";
import ScopeHandler from "../util/scope";

export type PluginsMap = Map<string, { [string]: any }>;

export default class Parser extends StatementParser {
  // Forward-declaration so typescript plugin can override jsx plugin
  +jsxParseOpeningElementAfterName: (
    node: JSXOpeningElement,
  ) => JSXOpeningElement;

  constructor(options: ?Options, input: string) {
      options = getOptions(options);
      super(options, input);

      this.options = options;
      this.inModule = this.options.sourceType === "module";
      this.scope = new ScopeHandler(this.raise.bind(this), this.inModule);
      this.plugins = pluginsMap(this.options.plugins);
      this.filename = options.sourceFilename;
  }

  parse(): File {
      this.scope.enter(SCOPE_PROGRAM);
      const file = this.startNode();
      const program = this.startNode();
      this.nextToken();
      return this.parseTopLevel(file, program);
  }
}

function pluginsMap(plugins: PluginList): PluginsMap {
    const pluginMap: PluginsMap = new Map();
    for (const plugin of plugins) {
        const [name, options] = is.array(plugin) ? plugin : [plugin, {}];
        if (!pluginMap.has(name)) {
            pluginMap.set(name, options || {}); 
        }
    }
    return pluginMap;
}