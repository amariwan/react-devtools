/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Badge } from "./badge";

describe("Badge", () => {
	it("renders", () => {
		render(<Badge>new</Badge>);
		expect(screen.getByText("new")).toBeTruthy();
	});
});
