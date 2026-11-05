/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PanelHeader } from "./panel-header";

describe("PanelHeader", () => {
	it("renders title", () => {
		render(<PanelHeader title="t" />);
		expect(screen.getByText("t")).toBeTruthy();
	});
});
