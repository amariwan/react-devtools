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

	it("uses a compact layout when embedded in a panel section", () => {
		const { container } = render(<EmptyState title="none" compact />);
		expect(container.firstElementChild?.className).toContain("devtools:py-5");
	});

	it("provides an inline layout for compact panel sections", () => {
		const { container } = render(
			<EmptyState title="none" compact layout="inline" />,
		);
		const emptyState = container.querySelector('[data-slot="empty-state"]');
		expect(emptyState?.className).toContain("devtools:flex-row");
		expect(emptyState?.className).toContain("devtools:text-left");
	});
});
