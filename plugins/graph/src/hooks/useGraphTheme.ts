import * as React from "react";
import {
	type GraphTheme,
	graphThemeSignature,
	resolveGraphTheme,
} from "../lib/graph-styles.js";

/**
 * Tracks the DevTools theme for the graph surface. Cytoscape needs concrete
 * colors, so the theme is re-read when the shell flips `data-theme`.
 */
export function useGraphTheme(
	containerRef: React.RefObject<HTMLElement | null>,
): GraphTheme {
	const [theme, setTheme] = React.useState<GraphTheme>(() =>
		resolveGraphTheme(null),
	);
	const signature = graphThemeSignature(theme);
	const signatureRef = React.useRef(signature);
	signatureRef.current = signature;

	React.useEffect(() => {
		if (typeof window === "undefined") return;
		const element = containerRef.current;
		const update = () => {
			const next = resolveGraphTheme(element ?? null);
			if (graphThemeSignature(next) === signatureRef.current) return;
			setTheme(next);
		};

		update();
		const observer = new MutationObserver(update);
		const themed = element?.closest("[data-theme]");
		if (themed) {
			observer.observe(themed, {
				attributes: true,
				attributeFilter: ["data-theme", "class", "style"],
			});
		}
		if (typeof document !== "undefined") {
			observer.observe(document.documentElement, {
				attributes: true,
				attributeFilter: ["data-theme", "class", "style"],
			});
		}

		const media =
			typeof window.matchMedia === "function"
				? window.matchMedia("(prefers-color-scheme: dark)")
				: null;
		media?.addEventListener("change", update);
		return () => {
			observer.disconnect();
			media?.removeEventListener("change", update);
		};
	}, [containerRef]);

	return theme;
}
