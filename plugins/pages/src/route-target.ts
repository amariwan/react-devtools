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
