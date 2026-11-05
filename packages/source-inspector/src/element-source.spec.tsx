/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { resolveElementSource } from "./element-source";

describe("element source", () => {
	it("resolves without react-grab", async () => {
		const el = document.createElement("div");
		const r = await resolveElementSource(el);
		expect(r).toBeTruthy();
		expect(typeof r.origin).toBe("string");
	});
});
