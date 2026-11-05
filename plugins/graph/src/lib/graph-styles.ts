import type { DependencyNodeKind } from "@next-devtools/runtime-react";
import type cytoscape from "cytoscape";

export interface GraphTheme {
	readonly isDark: boolean;
	readonly background: string;
	readonly surface: string;
	readonly text: string;
	readonly muted: string;
	readonly border: string;
	readonly accent: string;
	readonly warning: string;
	readonly danger: string;
	readonly success: string;
	readonly fontFamily: string;
	readonly monoFontFamily: string;
}

interface NodePalette {
	readonly fill: string;
	readonly border: string;
	readonly text: string;
}

const LIGHT_NODE_PALETTE: Readonly<Record<DependencyNodeKind, NodePalette>> = {
	component: { fill: "#dbeafe", border: "#2563eb", text: "#1e3a8a" },
	prop: { fill: "#cffafe", border: "#0891b2", text: "#155e75" },
	state: { fill: "#dcfce7", border: "#16a34a", text: "#14532d" },
	reducer: { fill: "#d1fae5", border: "#059669", text: "#064e3b" },
	memo: { fill: "#ede9fe", border: "#7c3aed", text: "#4c1d95" },
	callback: { fill: "#f3e8ff", border: "#a855f7", text: "#581c87" },
	effect: { fill: "#ffedd5", border: "#ea580c", text: "#7c2d12" },
	context: { fill: "#e0e7ff", border: "#4f46e5", text: "#312e81" },
	"external-store": { fill: "#ffe4e6", border: "#e11d48", text: "#881337" },
	selector: { fill: "#fef3c7", border: "#d97706", text: "#78350f" },
};

const DARK_NODE_PALETTE: Readonly<Record<DependencyNodeKind, NodePalette>> = {
	component: { fill: "#1e3a8a", border: "#60a5fa", text: "#dbeafe" },
	prop: { fill: "#164e63", border: "#22d3ee", text: "#cffafe" },
	state: { fill: "#14532d", border: "#4ade80", text: "#dcfce7" },
	reducer: { fill: "#064e3b", border: "#34d399", text: "#d1fae5" },
	memo: { fill: "#3b1d78", border: "#a78bfa", text: "#ede9fe" },
	callback: { fill: "#4c1d95", border: "#c084fc", text: "#f3e8ff" },
	effect: { fill: "#7c2d12", border: "#fb923c", text: "#ffedd5" },
	context: { fill: "#312e81", border: "#818cf8", text: "#e0e7ff" },
	"external-store": { fill: "#881337", border: "#fb7185", text: "#ffe4e6" },
	selector: { fill: "#78350f", border: "#fbbf24", text: "#fef3c7" },
};

const LIGHT_THEME: GraphTheme = {
	isDark: false,
	background: "#fafafa",
	surface: "#ffffff",
	text: "#18181b",
	muted: "#52525b",
	border: "rgba(82,82,91,0.35)",
	accent: "#2563eb",
	warning: "#d97706",
	danger: "#dc2626",
	success: "#16a34a",
	fontFamily:
		'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
	monoFontFamily:
		'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace',
};

const DARK_THEME: GraphTheme = {
	isDark: true,
	background: "#0e0e10",
	surface: "#18181b",
	text: "#e4e4e7",
	muted: "#a1a1aa",
	border: "rgba(161,161,170,0.4)",
	accent: "#60a5fa",
	warning: "#fbbf24",
	danger: "#f87171",
	success: "#4ade80",
	fontFamily:
		'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
	monoFontFamily:
		'ui-monospace, "SF Mono", "JetBrains Mono", Menlo, Consolas, monospace',
};

export function nodePalette(
	kind: DependencyNodeKind,
	theme: GraphTheme,
): NodePalette {
	return (theme.isDark ? DARK_NODE_PALETTE : LIGHT_NODE_PALETTE)[kind];
}

/**
 * Resolves theme colors from the DevTools Shadow DOM tokens. Cytoscape renders
 * to canvas and cannot consume CSS variables, so values are read once per
 * theme change and passed to the stylesheet builder.
 */
export function resolveGraphTheme(element?: Element | null): GraphTheme {
	if (typeof window === "undefined") return LIGHT_THEME;
	const target =
		element ??
		(typeof document !== "undefined" ? document.documentElement : null);
	if (!target) return LIGHT_THEME;
	let style: CSSStyleDeclaration;
	try {
		style = window.getComputedStyle(target);
	} catch {
		return LIGHT_THEME;
	}
	const read = (name: string, fallback: string): string => {
		const value = style.getPropertyValue(name).trim();
		return value.length > 0 ? value : fallback;
	};

	const themeAttr = target.closest("[data-theme]")?.getAttribute("data-theme");
	const background = read("--background", LIGHT_THEME.background);
	const isDark =
		themeAttr === "dark" || (themeAttr !== "light" && isDarkColor(background));

	const base = isDark ? DARK_THEME : LIGHT_THEME;
	return {
		...base,
		isDark,
		background,
		surface: read("--card", base.surface),
		text: read("--foreground", base.text),
		muted: read("--muted-foreground", base.muted),
		border: read("--border", base.border),
		accent: read("--primary", base.accent),
		warning: read("--warning", base.warning),
		danger: read("--destructive", base.danger),
		success: read("--success", base.success),
		fontFamily: read("--font-sans", base.fontFamily),
		monoFontFamily: read("--font-mono", base.monoFontFamily),
	};
}

/** Lightweight signature so effects only restyle when the theme changes. */
export function graphThemeSignature(theme: GraphTheme): string {
	return [
		theme.isDark,
		theme.background,
		theme.surface,
		theme.text,
		theme.muted,
		theme.border,
		theme.accent,
		theme.warning,
		theme.danger,
		theme.success,
	].join("|");
}

const EDGE_COLORS: Readonly<Record<string, (theme: GraphTheme) => string>> = {
	reads: (theme) => (theme.isDark ? "#94a3b8" : "#64748b"),
	consumes: (theme) => (theme.isDark ? "#818cf8" : "#4f46e5"),
	subscribes: (theme) => (theme.isDark ? "#fb7185" : "#e11d48"),
	"depends-on": (theme) => (theme.isDark ? "#60a5fa" : "#2563eb"),
	"observed-update": (theme) => theme.warning,
};

/**
 * Builds the Cytoscape stylesheet. Class-based states (selection, hover,
 * search) are applied by the canvas without rebuilding the stylesheet.
 */
export function buildGraphStylesheet(
	theme: GraphTheme,
): cytoscape.StylesheetJson {
	const palette = theme.isDark ? DARK_NODE_PALETTE : LIGHT_NODE_PALETTE;
	const nodeKindStyles = (Object.keys(palette) as DependencyNodeKind[]).map(
		(kind) => ({
			selector: `node[kind = "${kind}"]`,
			style: {
				"background-color": palette[kind].fill,
				"border-color": palette[kind].border,
				color: palette[kind].text,
			},
		}),
	);

	const edgeKindStyles = (
		Object.keys(EDGE_COLORS) as Array<keyof typeof EDGE_COLORS>
	).map((kind) => {
		const colorFactory = (
			EDGE_COLORS as Record<string, (theme: GraphTheme) => string>
		)[kind];
		const color = colorFactory ? colorFactory(theme) : theme.border;
		return {
			selector: `edge[kind = "${kind}"]`,
			style: {
				"line-color": color,
				"target-arrow-color": color,
				"source-arrow-color": color,
			},
		};
	});

	const stylesheet = [
		{
			selector: "node",
			style: {
				label: "data(label)",
				"font-family": theme.fontFamily,
				"font-size": 10,
				"font-weight": 500,
				color: theme.text,
				"text-valign": "bottom",
				"text-halign": "center",
				"text-margin-y": 6,
				"text-wrap": "ellipsis",
				"text-max-width": "110px",
				"text-background-color": theme.surface,
				"text-background-opacity": 0.82,
				"text-background-padding": "2px",
				"text-background-shape": "roundrectangle",
				"min-zoomed-font-size": 6,
				width: 28,
				height: 28,
				"border-width": 2,
				"border-color": theme.border,
				"background-color": theme.surface,
				shape: "ellipse",
				"overlay-opacity": 0,
				"transition-property": "border-width, border-color, opacity",
				"transition-duration": 0.15,
			},
		},
		...nodeKindStyles,
		{
			selector: 'node[kind = "component"]',
			style: {
				shape: "round-rectangle",
				width: 46,
				height: 30,
				"font-size": 11,
				"font-weight": 600,
				"text-max-width": "140px",
			},
		},
		{
			selector: 'node[kind = "context"]',
			style: { shape: "hexagon", width: 34, height: 34 },
		},
		{
			selector: 'node[kind = "external-store"]',
			style: { shape: "diamond", width: 34, height: 34 },
		},
		{
			selector: 'node[kind = "prop"]',
			style: { width: 24, height: 24 },
		},
		{
			selector: "node[root]",
			style: {
				width: 68,
				height: 44,
				"border-width": 3,
				"font-size": 12,
				"font-weight": 700,
				"text-max-width": "180px",
			},
		},
		{
			selector: 'node[evidence = "partial"]',
			style: { "border-style": "dashed" },
		},
		{
			selector: 'node[evidence = "unavailable"]',
			style: { opacity: 0.55, "border-style": "dotted" },
		},
		{
			selector: 'node[match = "false"]',
			style: { opacity: 0.18 },
		},
		{
			selector: "node.dimmed",
			style: { opacity: 0.14 },
		},
		{
			selector: "node.neighbor",
			style: { "border-width": 2.5 },
		},
		{
			selector: "node.selected",
			style: {
				"border-width": 4,
				"border-color": theme.accent,
				"underlay-color": theme.accent,
				"underlay-opacity": 0.16,
				"underlay-padding": 7,
				"text-background-opacity": 1,
			},
		},
		{
			selector: "edge",
			style: {
				width: 1.25,
				"line-color": theme.border,
				"target-arrow-color": theme.border,
				"target-arrow-shape": "triangle",
				"arrow-scale": 0.7,
				"curve-style": "bezier",
				"control-point-step-size": 38,
				opacity: 0.72,
				"font-family": theme.fontFamily,
				"font-size": 7,
				color: theme.muted,
				"text-background-color": theme.surface,
				"text-background-opacity": 0.85,
				"text-background-padding": "1px",
				"min-zoomed-font-size": 5,
				"transition-property": "opacity, width, line-color",
				"transition-duration": 0.15,
				"overlay-opacity": 0,
			},
		},
		...edgeKindStyles,
		{
			selector: 'edge[evidence = "partial"]',
			style: { "line-style": "dashed" },
		},
		{
			selector: 'edge[match = "false"]',
			style: { opacity: 0.08 },
		},
		{
			selector: "edge.dimmed",
			style: { opacity: 0.06 },
		},
		{
			selector: "edge.highlighted",
			style: { width: 2.5, opacity: 0.95 },
		},
		{
			selector: "edge.show-labels",
			style: {
				label: "data(relationshipLabel)",
				"text-rotation": "autorotate",
			},
		},
		{
			selector: "core",
			style: {
				"selection-box-color": theme.accent,
				"selection-box-border-color": theme.accent,
				"selection-box-opacity": 0.12,
				"active-bg-color": theme.accent,
			},
		},
	];

	return stylesheet as unknown as cytoscape.StylesheetJson;
}

function isDarkColor(color: string): boolean {
	const normalized = color.trim().toLowerCase();
	if (normalized.startsWith("#")) {
		const hex = normalized.slice(1);
		const expanded =
			hex.length === 3
				? hex
						.split("")
						.map((char) => `${char}${char}`)
						.join("")
				: hex;
		if (expanded.length >= 6) {
			const r = Number.parseInt(expanded.slice(0, 2), 16);
			const g = Number.parseInt(expanded.slice(2, 4), 16);
			const b = Number.parseInt(expanded.slice(4, 6), 16);
			if ([r, g, b].every((channel) => Number.isFinite(channel))) {
				return relativeLuminance(r, g, b) < 0.42;
			}
		}
	}
	const rgb = normalized.match(/rgba?\(([^)]+)\)/);
	if (rgb?.[1]) {
		const parts = rgb[1]
			.split(",")
			.map((part) => Number.parseFloat(part.trim()))
			.slice(0, 3);
		if (parts.length === 3 && parts.every((part) => Number.isFinite(part))) {
			return (
				relativeLuminance(parts[0] ?? 0, parts[1] ?? 0, parts[2] ?? 0) < 0.42
			);
		}
	}
	return false;
}

function relativeLuminance(r: number, g: number, b: number): number {
	const convert = (channel: number) => {
		const value = channel / 255;
		return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
	};
	return 0.2126 * convert(r) + 0.7152 * convert(g) + 0.0722 * convert(b);
}
