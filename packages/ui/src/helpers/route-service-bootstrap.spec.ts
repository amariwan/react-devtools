import { describe, expect, it } from "vitest";
import {
	createInitialRouteService,
	parseRouteMetadata,
} from "./route-service-bootstrap";

describe("route service bootstrap", () => {
	it("creates initial service", () => {
		const s = createInitialRouteService();
		expect(s).toBeTruthy();
	});

	it("parses route metadata", () => {
		const m = parseRouteMetadata(
			JSON.stringify({ "a.tsx": { execution: "client" } }),
		);
		expect(m["a.tsx"]).toEqual({ execution: "client" });
	});

	it("returns empty for invalid input", () => {
		expect(parseRouteMetadata(undefined)).toEqual({});
		expect(parseRouteMetadata("not json")).toEqual({});
		expect(parseRouteMetadata(JSON.stringify(null))).toEqual({});
		expect(parseRouteMetadata(JSON.stringify({ "a.tsx": "x" }))).toEqual({});
		expect(
			parseRouteMetadata(JSON.stringify({ "a.tsx": { execution: "nope" } })),
		).toEqual({});
	});

	it("parses from env", () => {
		const prev = process.env.NEXT_DEVTOOLS_ROUTE_FILES;
		const prevMeta = process.env.NEXT_DEVTOOLS_ROUTE_METADATA;
		const prevRoot = process.env.NEXT_DEVTOOLS_APP_ROOT;
		process.env.NEXT_DEVTOOLS_ROUTE_FILES = JSON.stringify(["app/page.tsx"]);
		process.env.NEXT_DEVTOOLS_ROUTE_METADATA = JSON.stringify({
			"app/page.tsx": { execution: "server" },
		});
		process.env.NEXT_DEVTOOLS_APP_ROOT = "src/app";
		const s = createInitialRouteService();
		expect(s).toBeTruthy();
		process.env.NEXT_DEVTOOLS_ROUTE_FILES = prev;
		process.env.NEXT_DEVTOOLS_ROUTE_METADATA = prevMeta;
		process.env.NEXT_DEVTOOLS_APP_ROOT = prevRoot;
	});
});
