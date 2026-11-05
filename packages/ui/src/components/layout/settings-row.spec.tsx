/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SettingsRow } from "./settings-row";

describe("SettingsRow", () => {
	it("renders label", () => {
		render(<SettingsRow label="l" />);
		expect(screen.getByText("l")).toBeTruthy();
	});
});
