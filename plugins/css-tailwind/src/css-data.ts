export interface CssHostSnapshot {
  readonly stylesheets: readonly string[];
}

export interface CssData {
  readonly tailwindDetected: boolean;
  readonly tokens: readonly string[];
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

  const tokens = new Set<string>();
  // Extract CSS custom property definitions (--name) from accessible rules.
  const customPropRegex = /--([a-zA-Z0-9_-]+)\s*:/g;
  let match: RegExpExecArray | null;
  while ((match = customPropRegex.exec(joined)) !== null) {
    tokens.add(`--${match[1]}`);
  }

  const ruleCount = sheets.reduce((count, sheet) => {
    // Rough count of rule blocks.
    return count + (sheet.match(/\{/g)?.length ?? 0);
  }, 0);

  return {
    tailwindDetected,
    tokens: Array.from(tokens).sort(),
    ruleCount,
  };
}
