/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TimelineControls } from "./timeline-controls";

describe("TimelineControls", () => {
	it("renders", () => {
		const { container } = render(
			<TimelineControls
				available={false}
				onStart={() => undefined}
				onStop={() => undefined}
				onClearEvents={() => undefined}
				recording={false}
				hasEvents={false}
				layers={[]}
				layerFilter="all"
				hasBaseline={false}
				onLayerFilterChange={() => undefined}
				onCaptureBaseline={() => undefined}
				onClearBaseline={() => undefined}
			/>,
		);
		expect(container).toBeTruthy();
	});
});
