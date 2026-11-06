/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GooeyInput } from "./gooey-input";

describe("GooeyInput", () => {
	it("renders", () => {
		render(<GooeyInput value="" onChange={() => undefined} placeholder="g" />);
		expect(
			screen.getByRole("button", { name: "Search panels and commands" }),
		).toBeTruthy();
	});

	it("opens a search field and collapses on Escape", () => {
		const onChange = vi.fn();
		const onOpen = vi.fn();
		render(<GooeyInput value="" onChange={onChange} onOpen={onOpen} />);

		fireEvent.click(
			screen.getByRole("button", { name: "Search panels and commands" }),
		);
		expect(screen.getByRole("searchbox", { name: "Search…" })).toBeTruthy();
		expect(onOpen).toHaveBeenCalledOnce();

		fireEvent.keyDown(window, { key: "Escape" });
		expect(
			screen.getByRole("button", { name: "Search panels and commands" }),
		).toBeTruthy();
		expect(onChange).toHaveBeenCalledWith("");
	});

	it("clears entered text with a named icon action", () => {
		const onChange = vi.fn();
		render(<GooeyInput value="graph" onChange={onChange} />);
		fireEvent.click(
			screen.getByRole("button", { name: "Search panels and commands" }),
		);

		fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
		expect(onChange).toHaveBeenCalledWith("");
	});
});
