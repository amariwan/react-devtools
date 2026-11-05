/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState } from "./empty-state";

describe("EmptyState", () => {
	it("renders title", () => {
		render(<EmptyState title="none" />);
		expect(screen.getByText("none")).toBeTruthy();
	});
});
