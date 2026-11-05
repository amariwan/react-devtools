/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NetworkEntryRow } from "./network-entry-row";

describe("NetworkEntryRow", () => {
	it("renders", () => {
		const entry = {
			id: "1",
			url: "http://x",
			method: "GET",
			status: 200,
		} as never;
		const { container } = render(
			<NetworkEntryRow
				entry={entry}
				expanded={false}
				onToggle={() => undefined}
			/>,
		);
		expect(container).toBeTruthy();
	});
});
