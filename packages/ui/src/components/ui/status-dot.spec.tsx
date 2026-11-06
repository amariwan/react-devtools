/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StatusDot } from "./status-dot";

describe("StatusDot", () => {
	it.each([
		["available", "devtools:bg-success"],
		["partial", "devtools:bg-warning"],
		["requires-instrumentation", "devtools:bg-info"],
		["experimental", "devtools:bg-violet-600"],
		["unavailable", "devtools:bg-destructive"],
		["error", "devtools:bg-destructive"],
		["diagnostic", "devtools:bg-destructive"],
	])("uses the semantic color for %s status", (status, colorClass) => {
		const { container } = render(<StatusDot status={status} />);
		const dot = container.querySelector("span span");
		expect(dot?.classList.contains(colorClass)).toBe(true);
	});
});
