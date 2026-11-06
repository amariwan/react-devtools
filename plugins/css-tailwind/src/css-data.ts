export interface CssHostSnapshot {
	readonly stylesheets: readonly string[];
	readonly declarations?: readonly CssVariableDeclaration[];
}

export interface CssVariableDeclaration {
	readonly name: string;
	readonly selector: string;
	readonly source: string;
	readonly value: string;
}

export interface CssToken {
	readonly name: string;
	readonly declarations: readonly Omit<CssVariableDeclaration, "name">[];
}

export interface CssData {
	readonly tailwindDetected: boolean;
	readonly tokens: readonly CssToken[];
	readonly ruleCount: number;
}

const TAILWIND_MARKERS = [
	"tailwindcss",
	"--tw-",
	".flex{display:flex}",
	".grid{display:grid}",
];

export function buildCssData(
	snapshot: CssHostSnapshot | null | undefined,
): CssData {
	const sheets = snapshot?.stylesheets ?? [];
	const joined = sheets.join("\n");
	const tailwindDetected = TAILWIND_MARKERS.some((marker) =>
		joined.toLowerCase().includes(marker.toLowerCase()),
	);

	const tokenNames = new Set<string>();
	// Extract CSS custom property definitions (--name) from accessible rules.
	const customPropRegex = /--([a-zA-Z0-9_-]+)\s*:/g;
	let match: RegExpExecArray | null;
	while (true) {
		match = customPropRegex.exec(joined);
		if (match === null) break;
		tokenNames.add(`--${match[1]}`);
	}
	const declarationsByName = new Map<
		string,
		Omit<CssVariableDeclaration, "name">[]
	>();
	for (const { name, selector, source, value } of snapshot?.declarations ??
		[]) {
		tokenNames.add(name);
		const declarations = declarationsByName.get(name) ?? [];
		declarations.push({ selector, source, value });
		declarationsByName.set(name, declarations);
	}

	const ruleCount = sheets.reduce((count, sheet) => {
		// Rough count of rule blocks.
		return count + (sheet.match(/\{/g)?.length ?? 0);
	}, 0);

	return {
		tailwindDetected,
		tokens: Array.from(tokenNames)
			.sort()
			.map((name) => ({
				name,
				declarations: declarationsByName.get(name) ?? [],
			})),
		ruleCount,
	};
}
