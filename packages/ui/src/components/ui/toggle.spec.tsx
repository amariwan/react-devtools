/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Toggle } from "./toggle";

describe("Toggle", () => {
	it("renders", () => {
		render(<Toggle aria-label="tg">x</Toggle>);
		expect(screen.getByText("x")).toBeTruthy();
	});
});
