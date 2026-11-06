import { SlidersHorizontalIcon } from "lucide-react";
import { describe, expect, it } from "vitest";
import { resolveIcon } from "./panel-icon";

describe("panel icon", () => {
	it("resolves icon", () => {
		const icon = resolveIcon("overview");
		expect(icon).toBeTruthy();
	});

	it("uses the controls icon for custom inspectors", () => {
		expect(resolveIcon("custom-inspector")).toBe(SlidersHorizontalIcon);
	});
});
