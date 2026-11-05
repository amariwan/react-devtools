/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SummaryCard } from "./summary-card";

describe("SummaryCard", () => {
	it("renders", () => {
		render(<SummaryCard label="l" value={42} />);
		expect(screen.getByText("l")).toBeTruthy();
	});
});
