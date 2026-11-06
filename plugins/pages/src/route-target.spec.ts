import { describe, expect, it } from "vitest";
import { matchesRoutePattern, resolveRouteTarget } from "./route-target";

describe("route target", () => {
	it("resolves static pattern", () => {
		const page = {
			id: "1",
			urlPattern: "/about",
			dynamicParamNames: [],
			optionalParamNames: [],
			fileRoles: [],
		} as never;
		expect(resolveRouteTarget(page, {})).toBe("/about");
	});

	it("resolves dynamic param", () => {
		const page = {
			id: "1",
			urlPattern: "/users/[id]",
			dynamicParamNames: ["id"],
			optionalParamNames: [],
			fileRoles: [],
		} as never;
		expect(resolveRouteTarget(page, { id: "42" })).toBe("/users/42");
	});

	it("returns null when a param cannot be resolved", () => {
		const page = {
			id: "1",
			urlPattern: "/users/[slug]",
			dynamicParamNames: ["id"],
			optionalParamNames: [],
			fileRoles: [],
		} as never;
		expect(resolveRouteTarget(page, { id: "42" })).toBeNull();
	});

	it("matches a dynamic route without accepting extra segments", () => {
		const page = {
			urlPattern: "/dashboard/[id]",
			dynamicParamNames: ["id"],
			optionalParamNames: [],
		} as never;
		expect(matchesRoutePattern(page, "/dashboard/42")).toBe(true);
		expect(matchesRoutePattern(page, "/dashboard/42/settings")).toBe(false);
	});

	it("matches catch-all and optional catch-all routes", () => {
		const catchAll = {
			urlPattern: "/docs/[...slug]",
			dynamicParamNames: ["slug"],
			optionalParamNames: [],
		} as never;
		const optionalCatchAll = {
			urlPattern: "/docs/[[...slug]]",
			dynamicParamNames: ["slug"],
			optionalParamNames: ["slug"],
		} as never;
		expect(matchesRoutePattern(catchAll, "/docs/guide/setup")).toBe(true);
		expect(matchesRoutePattern(catchAll, "/docs")).toBe(false);
		expect(matchesRoutePattern(optionalCatchAll, "/docs")).toBe(true);
		expect(matchesRoutePattern(optionalCatchAll, "/docs/guide/setup")).toBe(
			true,
		);
	});
});
