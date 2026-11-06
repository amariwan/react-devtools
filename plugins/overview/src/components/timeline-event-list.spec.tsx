/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TimelineEventList } from "./timeline-event-list";

describe("TimelineEventList", () => {
	it("renders", () => {
		const { container } = render(<TimelineEventList events={[]} />);
		expect(
			screen
				.getByRole("region", { name: "Timeline events" })
				.getAttribute("tabindex"),
		).toBe("0");
		expect(screen.getByRole("list")).toBeTruthy();
		expect(container).toBeTruthy();
	});

	it("loads older events in bounded batches", () => {
		const events = Array.from({ length: 250 }, (_, index) => ({
			id: `event-${index}`,
			layer: "react-render",
			type: "commit",
			timestampUnixMs: index,
			payload: { index },
		}));
		const { container } = render(<TimelineEventList events={events} />);
		const list = screen.getByRole("list");

		expect(list.querySelectorAll("li")).toHaveLength(101);
		expect(list.querySelector("li")?.textContent).toContain('"index":249');
		fireEvent.click(
			screen.getByRole("button", {
				name: "Load 100 older timeline events",
			}),
		);
		expect(list.querySelectorAll("li")).toHaveLength(201);
		expect(
			screen.getByRole("button", {
				name: "Load 50 older timeline events",
			}),
		).toBeTruthy();
		expect(container.querySelectorAll("li")).toHaveLength(201);
	});
});
