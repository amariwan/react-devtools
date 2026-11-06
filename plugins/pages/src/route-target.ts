import type { PageRow } from "./pages-data.js";

export function resolveRouteTarget(
	page: PageRow,
	values: Readonly<Record<string, string>>,
): string | null {
	let target = page.urlPattern;
	for (const name of page.dynamicParamNames) {
		const value = (values[name] ?? "").trim();
		const catchAllToken = `[...${name}]`;
		const isOptional = page.optionalParamNames.includes(name);
		const encoded = target.includes(catchAllToken)
			? value
				? value.split("/").filter(Boolean).map(encodeURIComponent).join("/")
				: ""
			: encodeURIComponent(value);
		if (isOptional && !value) {
			target = target.replace(`/${catchAllToken}`, "");
		} else {
			target = target
				.replace(catchAllToken, encoded)
				.replace(`[${name}]`, encoded);
		}
	}
	return target.includes("[") ? null : target;
}

export function matchesRoutePattern(page: PageRow, pathname: string): boolean {
	const pathOnly = pathname.split(/[?#]/, 1)[0] ?? pathname;
	const currentSegments = pathOnly.split("/").filter(Boolean);
	const patternSegments = page.urlPattern.split("/").filter(Boolean);
	let currentIndex = 0;

	for (const [patternIndex, segment] of patternSegments.entries()) {
		const optionalCatchAll = /^\[\[\.\.\.([^\]]+)\]\]$/.exec(segment);
		if (optionalCatchAll) {
			const name = optionalCatchAll[1];
			return (
				patternIndex === patternSegments.length - 1 &&
				name !== undefined &&
				page.optionalParamNames.includes(name)
			);
		}

		const catchAll = /^\[\.\.\.([^\]]+)\]$/.exec(segment);
		if (catchAll) {
			const name = catchAll[1];
			return (
				patternIndex === patternSegments.length - 1 &&
				name !== undefined &&
				page.dynamicParamNames.includes(name) &&
				currentIndex < currentSegments.length
			);
		}

		const dynamic = /^\[([^\]]+)\]$/.exec(segment);
		const name = dynamic?.[1];
		if (name && page.dynamicParamNames.includes(name)) {
			if (!currentSegments[currentIndex]) return false;
			currentIndex += 1;
			continue;
		}

		if (currentSegments[currentIndex] !== segment) return false;
		currentIndex += 1;
	}

	return currentIndex === currentSegments.length;
}
