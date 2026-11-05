/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Label } from "./label";

describe("Label", () => {
	it("renders", () => {
		render(<Label>name</Label>);
		expect(screen.getByText("name")).toBeTruthy();
	});
});
