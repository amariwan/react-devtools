/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KeyboardShortcuts } from "./keyboard-shortcuts";

describe("KeyboardShortcuts", () => {
	it("renders", () => {
		const { container } = render(<KeyboardShortcuts isMac={false} />);
		expect(container).toBeTruthy();
	});
});
