import { describe, expect, it } from "vitest";
import {
	buildGraphStylesheet,
	graphThemeSignature,
	nodePalette,
	resolveGraphTheme,
} from "./graph-styles";

describe("graph styles", () => {
	it("resolves theme", () => {
		const t = resolveGraphTheme();
		expect(t).toBeTruthy();
	});

	it("signatures differ", () => {
		const t = resolveGraphTheme();
		expect(typeof graphThemeSignature(t)).toBe("string");
	});

	it("node palette returns color", () => {
		const t = resolveGraphTheme();
		expect(nodePalette("component", t)).toBeTruthy();
	});

	it("keeps node labels readable when compact graph layouts zoom out", () => {
		const styles = buildGraphStylesheet(resolveGraphTheme());
		const nodeStyle = styles.find((style) => style.selector === "node");
		expect(nodeStyle?.style).toMatchObject({
			"font-size": 11,
			"min-zoomed-font-size": 6,
			"text-background-opacity": 0.94,
		});
	});

	it("keeps unclassified dependency edges visible against the canvas", () => {
		const theme = resolveGraphTheme();
		const styles = buildGraphStylesheet(theme);
		const edgeStyle = styles.find((style) => style.selector === "edge");
		expect(edgeStyle?.style).toMatchObject({
			"line-color": theme.muted,
			"target-arrow-color": theme.muted,
		});
	});

	it("keeps the root and selected neighborhood labeled in dense overviews", () => {
		const styles = buildGraphStylesheet(resolveGraphTheme());
		const hiddenLabelStyle = styles.find(
			(style) => style.selector === "node.labels-hidden",
		);
		const labelStyle = styles.find((style) =>
			style.selector.includes("node.labels-hidden[root]"),
		);
		expect(hiddenLabelStyle?.style).toMatchObject({ label: "" });
		expect(labelStyle?.style).toMatchObject({
			label: "data(label)",
			"text-opacity": 1,
			"text-background-opacity": 0.94,
		});
	});
});
