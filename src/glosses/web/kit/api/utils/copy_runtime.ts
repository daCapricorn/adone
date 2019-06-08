const {
	fs,
	path
} = adone;

const foundationFiles = fs.readdirSync(path.join(__dirname, "../../../runtime/foundation"));

const runtime = [
	...foundationFiles.filter((name) => !name.endsWith(".js")).map((name) => {
		return (name === "index.mjs")
			? path.join("foundation", name)
			: path.join("foundation", name, "index.mjs")
	}),
	'app.mjs',
	'server.mjs',
	'internal/shared.mjs',
	'internal/layout.svelte',
	'internal/error.svelte'
].map(file => ({
	file,
	source: fs.readFileSync(path.join(__dirname, `../../../runtime/${file}`), 'utf-8')
}));

export function copy_runtime(output: string) {
	runtime.forEach(({ file, source }) => {
		fs.mkdirpSync(path.dirname(`${output}/${file}`));
		fs.writeFileSync(`${output}/${file}`, source);
	});
}