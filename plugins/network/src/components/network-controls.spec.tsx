/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NetworkControls } from "./network-controls";

describe("NetworkControls", () => {
	it("renders", () => {
		const { container } = render(
			<NetworkControls
				available={false}
				recording={false}
				status="unavailable"
				entryCount={0}
				hasVisibleEntries={false}
				query=""
				initiatorFilter="all"
				initiators={[]}
				onToggleRecording={() => undefined}
				onClear={() => undefined}
				onExport={() => undefined}
				onQueryChange={() => undefined}
				onInitiatorChange={() => undefined}
			/>,
		);
		expect(container).toBeTruthy();
	});
});
