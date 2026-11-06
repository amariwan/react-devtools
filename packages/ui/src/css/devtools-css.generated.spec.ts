import { describe, expect, it } from "vitest";
import { devtoolsCssText } from "./devtools-css.generated";

describe("devtools css generated", () => {
	it("exports css text", () => {
		expect(typeof devtoolsCssText).toBe("string");
		expect(devtoolsCssText.length).toBeGreaterThan(0);
	});

	it("initializes Tailwind border styles inside the shadow root", () => {
		expect(devtoolsCssText).toContain(":host,:host *{--tw-border-style:solid}");
	});
});
