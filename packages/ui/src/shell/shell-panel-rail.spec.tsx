/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PanelRail } from "./shell-panel-rail";

describe("PanelRail", () => {
	it("renders", () => {
		const { container } = render(
			<PanelRail
				panels={[]}
				activePanelId={null}
				settingsOpen={false}
				onSelect={() => undefined}
				onSettings={() => undefined}
			/>,
		);
		expect(container.firstChild).toBeTruthy();
	});
});
