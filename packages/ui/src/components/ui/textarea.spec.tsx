/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Textarea } from "./textarea";

describe("Textarea", () => {
	it("renders", () => {
		render(<Textarea placeholder="t" />);
		expect(screen.getByPlaceholderText("t")).toBeTruthy();
	});
});
