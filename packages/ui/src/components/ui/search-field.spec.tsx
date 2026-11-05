/**
 * @vitest-environment jsdom
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SearchField } from "./search-field";

describe("SearchField", () => {
	it("renders", () => {
		render(<SearchField placeholder="q" />);
		expect(screen.getByPlaceholderText("q")).toBeTruthy();
	});
});
