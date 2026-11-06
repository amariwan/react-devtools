/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Textarea } from "./textarea";

describe("Textarea", () => {
	it("renders", () => {
		render(<Textarea placeholder="t" />);
		const textarea = screen.getByPlaceholderText("t");
		expect(textarea).toBeTruthy();
		expect(textarea.className).toContain("devtools:text-foreground");
	});
});
