/* global console, process */

import { readdirSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname);
const violations = [];

function walk(dir, cb) {
	let entries;
	try {
		entries = readdirSync(dir, { withFileTypes: true });
	} catch {
		return;
	}
	for (const entry of entries) {
		const full = join(dir, entry.name);
		if (entry.isDirectory()) {
			if (
				entry.name === "node_modules" ||
				entry.name === "dist" ||
				entry.name === ".git" ||
				entry.name === ".next"
			)
				continue;
			if (entry.name === "__tests__") {
				violations.push(
					`Forbidden __tests__ directory: ${relative(root, full)}`,
				);
			}
			walk(full, cb);
		} else {
			cb(full);
		}
	}
}

walk(root, (file) => {
	const rel = relative(root, file);
	if (rel.endsWith(".test.ts") || rel.endsWith(".test.tsx")) {
		violations.push(`Forbidden .test file (use .spec): ${rel}`);
	}
});

// Playwright/Vitest overlap: browser e2e files must not be discovered by vitest include.
// Check vitest config include does not contain tests/browser.
import { readFileSync } from "node:fs";
const vitestConfig = readFileSync(join(root, "vitest.config.ts"), "utf8");
if (/tests\/browser/.test(vitestConfig)) {
	violations.push("vitest.config.ts must not include tests/browser");
}

if (violations.length) {
	for (const v of violations) console.error(v);
	process.exit(1);
}
console.log("test-architecture: PASS");
