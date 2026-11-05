/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import * as mod from "./instrumentation-client";

describe("instrumentation client", () => {
	it("exports module", () => {
		expect(mod).toBeTruthy();
	});
});
