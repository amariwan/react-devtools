/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import CssTailwindPanel from "./CssTailwindPanel";

describe("CssTailwindPanel", () => {
	it("renders", () => {
		const registry = {
			capabilities: {
				onChange: () => () => undefined,
				list: () => [],
				require: () => undefined,
			},
			services: { get: () => undefined, subscribe: () => () => undefined },
			list: () => [],
			panels: { list: () => [], onChange: () => () => undefined },
			commands: { list: () => [] },
			events: { on: () => () => undefined, emit: () => undefined },
		} as never;
		const { container } = render(<CssTailwindPanel registry={registry} />);
		expect(container).toBeTruthy();
		expect(
			screen
				.getByRole("textbox", { name: "Search CSS tokens" })
				.getAttribute("placeholder"),
		).toBe("Search tokens…");
	});

	it("uses the search field clear button for empty results", async () => {
		const style = document.createElement("style");
		style.textContent = ":root { --e2e-token: 1; }";
		document.head.append(style);

		try {
			render(<CssTailwindPanel registry={{} as never} />);
			await waitFor(() => expect(screen.getByText("--e2e-token")).toBeTruthy());

			fireEvent.change(
				screen.getByRole("textbox", { name: "Search CSS tokens" }),
				{
					target: { value: "missing-css-token" },
				},
			);
			expect(screen.getByText("No matching properties")).toBeTruthy();
			expect(
				screen.getAllByRole("button", { name: "Clear search" }),
			).toHaveLength(1);

			fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
			expect(screen.getByText("--e2e-token")).toBeTruthy();
		} finally {
			style.remove();
		}
	});

	it("explains when readable stylesheets contain no custom properties", async () => {
		const style = document.createElement("style");
		style.textContent = ".app { display: block; }";
		document.head.append(style);

		try {
			render(<CssTailwindPanel registry={{} as never} />);
			await waitFor(() =>
				expect(
					screen.getByText(
						"Readable stylesheets contain no CSS custom properties.",
					),
				).toBeTruthy(),
			);
		} finally {
			style.remove();
		}
	});

	it("shows each custom property value with its declaring selector", async () => {
		const style = document.createElement("style");
		style.textContent = ":root { --inspect-color: #b84; }";
		document.head.append(style);

		try {
			render(<CssTailwindPanel registry={{} as never} />);
			await waitFor(() => expect(screen.getByText("#b84")).toBeTruthy());
			expect(screen.getByText(/:root/)).toBeTruthy();
			expect(screen.getByText(/inline stylesheet/)).toBeTruthy();
		} finally {
			style.remove();
		}
	});

	it("copies a CSS variable reference and announces success", async () => {
		const style = document.createElement("style");
		style.textContent = ":root { --copy-token: 1; }";
		document.head.append(style);
		const writeText = vi.fn().mockResolvedValue(undefined);
		const clipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard");
		Object.defineProperty(navigator, "clipboard", {
			configurable: true,
			value: { writeText },
		});

		try {
			render(<CssTailwindPanel registry={{} as never} />);
			await waitFor(() =>
				expect(screen.getByText("--copy-token")).toBeTruthy(),
			);
			fireEvent.click(
				screen.getByRole("button", { name: "Copy var(--copy-token)" }),
			);
			await waitFor(() =>
				expect(writeText).toHaveBeenCalledWith("var(--copy-token)"),
			);
			expect((await screen.findByRole("status")).textContent).toBe(
				"Copied var(--copy-token).",
			);
		} finally {
			style.remove();
			if (clipboard) {
				Object.defineProperty(navigator, "clipboard", clipboard);
			} else {
				Reflect.deleteProperty(navigator, "clipboard");
			}
		}
	});
});
