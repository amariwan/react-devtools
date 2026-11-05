/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { InspectorSection } from "./inspector-section";

describe("InspectorSection", () => {
	it("renders title", () => {
		render(<InspectorSection title="t">c</InspectorSection>);
		expect(screen.getByText("t")).toBeTruthy();
	});
});
