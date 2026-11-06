import { execFileSync } from "node:child_process";
import {
	copyFileSync,
	mkdirSync,
	readdirSync,
	readFileSync,
	rmSync,
	statSync,
	writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

const packageDir = resolve(new URL("..", import.meta.url).pathname);
const root = resolve(packageDir, "../..");
const distDir = join(packageDir, "dist");

const internalDirs = [
	"packages/cli",
	"packages/contracts",
	"packages/core",
	"packages/host-next",
	"packages/plugin-sdk",
	"packages/runtime-react",
	"packages/source-inspector",
	"packages/transport-devframe",
	"packages/ui",
	"plugins/agent-mcp",
	"plugins/components",
	"plugins/css-tailwind",
	"plugins/graph",
	"plugins/network",
	"plugins/overview",
	"plugins/pages",
	"plugins/state-redux",
	"plugins/state-tanstack-query",
	"plugins/state-zustand",
];

function copyDirectory(source, destination) {
	mkdirSync(destination, { recursive: true });
	for (const entry of readdirSync(source)) {
		if (entry.includes(".spec.") || entry.includes(".test.")) continue;
		const from = join(source, entry);
		const to = join(destination, entry);
		if (statSync(from).isDirectory()) copyDirectory(from, to);
		else copyFileSync(from, to);
	}
}

function walk(directory) {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const path = join(directory, entry.name);
		return entry.isDirectory() ? walk(path) : [path];
	});
}

rmSync(distDir, { recursive: true, force: true });
execFileSync("bun", ["x", "tsc", "-p", join(packageDir, "tsconfig.json")], {
	 cwd: root,
	 stdio: "inherit",
});

const packageNames = [];
const entryTargets = new Map();
for (const directory of internalDirs) {
	const source = resolve(root, directory, "dist");
	const manifest = JSON.parse(
		readFileSync(resolve(root, directory, "package.json"), "utf8"),
	);
	if (!statSync(source, { throwIfNoEntry: false })) {
		throw new Error(`Missing compiled internal package: ${source}`);
	}
	const vendorDir = join(distDir, "vendor", manifest.name, "dist");
	copyDirectory(source, vendorDir);
	packageNames.push(manifest.name);
	entryTargets.set(manifest.name, "index.js");
	for (const [exportName, definition] of Object.entries(manifest.exports ?? {})) {
		const target =
			typeof definition === "string"
				? definition
				: definition?.default ?? definition?.import ?? definition?.types;
		if (typeof target === "string") {
			entryTargets.set(
				`${manifest.name}${exportName === "." ? "" : `/${exportName.replace(/^\.\//, "")}`}`,
				target.replace(/^\.\//, "").replace(/^dist\//, ""),
			);
		}
	}
}

const names = packageNames.sort((a, b) => b.length - a.length);
for (const file of walk(distDir).filter(
	(file) => file.endsWith(".js") || file.endsWith(".d.ts"),
)) {
	let contents = readFileSync(file, "utf8");
	for (const name of names) {
		const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		contents = contents.replace(
			new RegExp(`${escaped}(\\/[^"'\\s)]*)?`, "g"),
			(_match, subpath = "") => {
				const target = join(
					distDir,
					"vendor",
					name,
					"dist",
					entryTargets.get(`${name}${subpath}`) ??
						(subpath ? `${subpath.slice(1)}.js` : "index.js"),
				);
				const importPath = relative(dirname(file), target).replaceAll("\\", "/");
				return importPath.startsWith(".") ? importPath : `./${importPath}`;
			},
		);
	}
	writeFileSync(file, contents);
}
