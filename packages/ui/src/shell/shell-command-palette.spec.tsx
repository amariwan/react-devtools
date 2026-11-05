/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CommandPalette } from "./shell-command-palette";

describe("CommandPalette", () => {
	it("renders", () => {
		const { container } = render(
			<CommandPalette
				panels={[]}
				commands={[]}
				runtimeEntries={[]}
				onSelectPanel={() => undefined}
				onClose={() => undefined}
			/>,
		);
		expect(container).toBeTruthy();
	});
});
