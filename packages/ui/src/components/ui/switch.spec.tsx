/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Switch } from "./switch";

describe("Switch", () => {
	it("renders", () => {
		render(<Switch aria-label="sw" />);
		expect(screen.getByRole("switch")).toBeTruthy();
	});
});
