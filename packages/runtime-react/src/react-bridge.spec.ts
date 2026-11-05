import { describe, expect, it } from "vitest";
import {
	REACT_DEVTOOLS_BASELINE,
	detectReactDevtoolsExtension,
	installReactDevtoolsHookEarly,
} from "./react-bridge";

describe("react bridge", () => {
	it("exports baseline", () => {
		expect(REACT_DEVTOOLS_BASELINE).toBeTruthy();
	});

	it("detects extension", () => {
		expect(typeof detectReactDevtoolsExtension()).toBe("boolean");
	});

	it("installs hook early", () => {
		expect(typeof installReactDevtoolsHookEarly()).toBe("boolean");
	});
});
