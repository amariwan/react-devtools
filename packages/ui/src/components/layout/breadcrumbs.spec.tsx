/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Breadcrumbs } from "./breadcrumbs";

describe("Breadcrumbs", () => {
	it("renders", () => {
		render(<Breadcrumbs items={[{ label: "home" }]} />);
		expect(screen.getByText("home")).toBeTruthy();
	});
});
