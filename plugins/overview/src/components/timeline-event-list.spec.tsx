/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TimelineEventList } from "./timeline-event-list";

describe("TimelineEventList", () => {
	it("renders", () => {
		const { container } = render(<TimelineEventList events={[]} />);
		expect(container).toBeTruthy();
	});
});
