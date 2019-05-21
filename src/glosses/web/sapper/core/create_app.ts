import * as fs from 'fs';
import * as path from 'path';
import { posixify, stringify, walk, write_if_changed } from '../utils';
import { Page, PageComponent, ManifestData } from '../interfaces';

export function create_app({
	bundler,
	manifest_data,
	dev_port,
	dev,
	cwd,
	src,
	dest,
	routes,
	output
}: {
	bundler: string,
	manifest_data: ManifestData;
	dev_port?: number;
	dev: boolean;
	cwd: string;
	src: string;
	dest: string;
	routes: string;
	output: string
}) {
	if (!fs.existsSync(output)) fs.mkdirSync(output);

	const path_to_routes = path.relative(`${output}/internal`, routes);

	const client_manifest = generate_client_manifest(manifest_data, path_to_routes, bundler, dev, dev_port);
	const server_manifest = generate_server_manifest(manifest_data, path_to_routes, cwd, src, dest, dev);

	const app = generate_app(manifest_data, path_to_routes);

	write_if_changed(`${output}/internal/manifest-client.mjs`, client_manifest);
	write_if_changed(`${output}/internal/manifest-server.mjs`, server_manifest);
	write_if_changed(`${output}/internal/App.svelte`, app);
}

export function create_serviceworker_manifest({ manifest_data, output, client_files, static_files }: {
	manifest_data: ManifestData;
	output: string;
	client_files: string[];
	static_files: string;
}) {
	let files: string[] = ['service-worker-index.html'];

	if (fs.existsSync(static_files)) {
		files = files.concat(walk(static_files));
	} else {
		// TODO remove in a future version
		if (fs.existsSync('assets')) {
			throw new Error(`As of Sapper 0.21, the assets/ directory should become static/`);
		}
	}

	let code = `
		// This file is generated by Sapper — do not edit it!
		export const timestamp = ${Date.now()};

		export const files = [\n\t${files.map((x: string) => stringify(x)).join(',\n\t')}\n];
		export { files as assets }; // legacy

		export const shell = [\n\t${client_files.map((x: string) => stringify(x)).join(',\n\t')}\n];

		export const routes = [\n\t${manifest_data.pages.map((r: Page) => `{ pattern: ${r.pattern} }`).join(',\n\t')}\n];
	`.replace(/^\t\t/gm, '').trim();

	write_if_changed(`${output}/service-worker.js`, code);
}

function create_param_match(param: string, i: number) {
	return /^\.{3}.+$/.test(param)
		? `${param.replace(/.{3}/, '')}: d(match[${i + 1}]).split('/')`
		: `${param}: d(match[${i + 1}])`
}

function generate_client_manifest(
	manifest_data: ManifestData,
	path_to_routes: string,
	bundler: string,
	dev: boolean,
	dev_port?: number
) {
	const page_ids = new Set(manifest_data.pages.map(page =>
		page.pattern.toString()));

	const server_routes_to_ignore = manifest_data.server_routes.filter(route =>
		!page_ids.has(route.pattern.toString()));

	const component_indexes: Record<string, number> = {};

	const components = `[
		${manifest_data.components.map((component, i) => {
			const annotation = '';

			const source = get_file(path_to_routes, component);

			component_indexes[component.name] = i;

			return `{
					js: () => import(${annotation}${stringify(source)}),
					css: "__SAPPER_CSS_PLACEHOLDER:${stringify(component.file, false)}__"
				}`;
		}).join(',\n\t\t\t\t')}
	]`.replace(/^\t/gm, '');

	let needs_decode = false;

	let routes = `[
				${manifest_data.pages.map(page => `{
					// ${page.parts[page.parts.length - 1].component.file}
					pattern: ${page.pattern},
					parts: [
						${page.parts.map(part => {
							if (part === null) return 'null';

							if (part.params.length > 0) {
								needs_decode = true;
								const props = part.params.map(create_param_match);
								return `{ i: ${component_indexes[part.component.name]}, params: match => ({ ${props.join(', ')} }) }`;
							}

							return `{ i: ${component_indexes[part.component.name]} }`;
						}).join(',\n\t\t\t\t\t\t')}
					]
				}`).join(',\n\n\t\t\t\t')}
	]`.replace(/^\t/gm, '');

	if (needs_decode) {
		routes = `(d => ${routes})(decodeURIComponent)`
	}

	return `
		// This file is generated by Sapper — do not edit it!
		export { default as Root } from '${stringify(get_file(path_to_routes, manifest_data.root), false)}';
		export { preload as root_preload } from '${manifest_data.root.has_preload ? stringify(get_file(path_to_routes, manifest_data.root), false) : './shared'}';
		export { default as ErrorComponent } from '${stringify(get_file(path_to_routes, manifest_data.error), false)}';

		export const ignore = [${server_routes_to_ignore.map(route => route.pattern).join(', ')}];

		export const components = ${components};

		export const routes = ${routes};

		${dev ? `if (typeof window !== 'undefined') {
			import(${stringify(posixify(path.resolve(__dirname, '../sapper-dev-client.js')))}).then(client => {
				client.connect(${dev_port});
			});
		}` : ''}
	`.replace(/^\t{2}/gm, '').trim();
}

function generate_server_manifest(
	manifest_data: ManifestData,
	path_to_routes: string,
	cwd: string,
	src: string,
	dest: string,
	dev: boolean
) {
	const imports = [].concat(
		manifest_data.server_routes.map((route, i) =>
			`import * as route_${i} from ${stringify(posixify(`${path_to_routes}/${route.file}`))};`),
		manifest_data.components.map((component, i) =>
			`import component_${i}${component.has_preload ? `, { preload as preload_${i} }` : ''} from ${stringify(get_file(path_to_routes, component))};`),
		`import root${manifest_data.root.has_preload ? `, { preload as root_preload }` : ''} from ${stringify(get_file(path_to_routes, manifest_data.root))};`,
		`import error from ${stringify(get_file(path_to_routes, manifest_data.error))};`
	);

	const component_lookup: Record<string, number> = {};
	manifest_data.components.forEach((component, i) => {
		component_lookup[component.name] = i;
	});

	let code = `
		`.replace(/^\t\t/gm, '').trim();

	const build_dir = posixify(path.relative(cwd, dest));
	const src_dir = posixify(path.relative(cwd, src));

	return `
		// This file is generated by Sapper — do not edit it!
		${imports.join('\n')}

		const d = decodeURIComponent;

		export const manifest = {
			server_routes: [
				${manifest_data.server_routes.map((route, i) => `{
					// ${route.file}
					pattern: ${route.pattern},
					handlers: route_${i},
					params: ${route.params.length > 0
						? `match => ({ ${route.params.map(create_param_match).join(', ')} })`
						: `() => ({})`}
				}`).join(',\n\n\t\t\t\t')}
			],

			pages: [
				${manifest_data.pages.map(page => `{
					// ${page.parts[page.parts.length - 1].component.file}
					pattern: ${page.pattern},
					parts: [
						${page.parts.map(part => {
							if (part === null) return 'null';

							const props = [
								`name: "${part.component.name}"`,
								`file: ${stringify(part.component.file)}`,
								`component: component_${component_lookup[part.component.name]}`,
								part.component.has_preload && `preload: preload_${component_lookup[part.component.name]}`
							].filter(Boolean);

							if (part.params.length > 0) {
								const params = part.params.map(create_param_match);
								props.push(`params: match => ({ ${params.join(', ')} })`);
							}

							return `{ ${props.join(', ')} }`;
						}).join(',\n\t\t\t\t\t\t')}
					]
				}`).join(',\n\n\t\t\t\t')}
			],

			root,
			root_preload${manifest_data.root.has_preload ? '' : `: () => {}`},
			error
		};

		export const build_dir = ${JSON.stringify(build_dir)};

		export const src_dir = ${JSON.stringify(src_dir)};

		export const dev = ${dev ? 'true' : 'false'};
	`.replace(/^\t{2}/gm, '').trim();
}

function generate_app(manifest_data: ManifestData, path_to_routes: string) {
	// TODO remove default layout altogether

	const max_depth = Math.max(...manifest_data.pages.map(page => page.parts.filter(Boolean).length));

	const levels = [];
	for (let i = 0; i < max_depth; i += 1) {
		levels.push(i + 1);
	}

	let l = max_depth;

	let pyramid = `<svelte:component this="{level${l}.component}" {...level${l}.props}/>`;

	while (l-- > 1) {
		pyramid = `
			<svelte:component this="{level${l}.component}" segment="{segments[${l}]}" {...level${l}.props}>
				{#if level${l + 1}}
					${pyramid.replace(/\n/g, '\n\t\t\t\t\t')}
				{/if}
			</svelte:component>
		`.replace(/^\t\t\t/gm, '').trim();
	}

	return `
		<!-- This file is generated by Sapper — do not edit it! -->
		<script>
			import { setContext } from '${adone.getPath("lib", "glosses", "web", "browser", "core")}';
			import { CONTEXT_KEY } from './shared';
			import Layout from '${get_file(path_to_routes, manifest_data.root)}';
			import Error from '${get_file(path_to_routes, manifest_data.error)}';

			export let stores;
			export let error;
			export let status;
			export let segments;
			export let level0;
			${levels.map(l => `export let level${l} = null;`).join('\n\t\t\t')}

			setContext(CONTEXT_KEY, stores);
		</script>

		<Layout segment="{segments[0]}" {...level0.props}>
			{#if error}
				<Error {error} {status}/>
			{:else}
				${pyramid.replace(/\n/g, '\n\t\t\t\t')}
			{/if}
		</Layout>
	`.replace(/^\t\t/gm, '').trim();
}

function get_file(path_to_routes: string, component: PageComponent) {
	if (component.default) return `./${component.type}.svelte`;
	return posixify(`${path_to_routes}/${component.file}`);
}
