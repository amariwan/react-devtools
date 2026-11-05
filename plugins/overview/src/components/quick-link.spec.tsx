/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { QuickLink } from "./quick-link";

describe("QuickLink", () => {
	it("renders", () => {
		render(<QuickLink icon={() => null} label="l" />);
		expect(screen.getByText("l")).toBeTruthy();
	});
});
