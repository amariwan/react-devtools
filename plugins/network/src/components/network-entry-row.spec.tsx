/**
 * @vitest-environment jsdom
 */
import type { NetworkEntry } from "@next-devtools/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { NetworkEntryRow } from "./network-entry-row";

describe("NetworkEntryRow", () => {
	it("renders", () => {
		const entry: NetworkEntry = {
			id: "1",
			url: "https://example.dev/assets/client.js?build=123",
			initiatorType: "script",
			status: 200,
			startTime: 10,
			duration: 4,
			transferSize: 128,
			encodedBodySize: 128,
			decodedBodySize: 256,
			capturedAtUnixMs: 1_800_000_000_000,
		};
		const { container } = render(
			<NetworkEntryRow
				entry={entry}
				expanded={false}
				onToggle={() => undefined}
			/>,
		);
		expect(container).toBeTruthy();
	});

	it("copies the full request URL and announces success", async () => {
		const entry: NetworkEntry = {
			id: "1",
			url: "https://example.dev/assets/client.js?build=123",
			initiatorType: "script",
			status: 200,
			startTime: 10,
			duration: 4,
			transferSize: 128,
			encodedBodySize: 128,
			decodedBodySize: 256,
			capturedAtUnixMs: 1_800_000_000_000,
		};
		const writeText = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(navigator, "clipboard", {
			configurable: true,
			value: { writeText },
		});
		render(
			<NetworkEntryRow entry={entry} expanded onToggle={() => undefined} />,
		);

		fireEvent.click(screen.getByRole("button", { name: "Copy request URL" }));

		expect(writeText).toHaveBeenCalledWith(entry.url);
		expect((await screen.findByRole("status")).textContent).toBe(
			"Request URL copied to clipboard.",
		);
	});
});
