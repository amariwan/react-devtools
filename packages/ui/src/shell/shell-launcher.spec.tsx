/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DevtoolsLauncher } from "./shell-launcher";

describe("DevtoolsLauncher", () => {
	it("renders", () => {
		render(
			<DevtoolsLauncher onOpen={() => undefined} onPick={() => undefined} />,
		);
		expect(screen.getByLabelText("Open Next.js DevTools")).toBeTruthy();
	});
});
