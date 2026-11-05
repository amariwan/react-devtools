/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GooeyInput } from "./gooey-input";

describe("GooeyInput", () => {
	it("renders", () => {
		render(<GooeyInput value="" onChange={() => undefined} placeholder="g" />);
		expect(screen.getByRole("button")).toBeTruthy();
	});
});
