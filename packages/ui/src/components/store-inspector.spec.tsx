import { encodeValue } from "@next-devtools/contracts";
/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StoreInspector } from "./store-inspector";

describe("StoreInspector", () => {
	it("renders", () => {
		const { container } = render(
			<StoreInspector
				adapters={[]}
				onSelect={() => undefined}
				onRefresh={() => undefined}
			/>,
		);
		expect(container).toBeTruthy();
		expect(screen.getByRole("button", { name: "Refresh store" })).toBeTruthy();
	});

	it("keeps the store placeholder disabled until an adapter is selected", async () => {
		const onSelect = vi.fn();
		render(
			<StoreInspector
				adapters={[{ id: "store", label: "Store" }]}
				onSelect={onSelect}
				onRefresh={() => undefined}
			/>,
		);

		const select = screen.getByRole("combobox", {
			name: "Store adapter",
		}) as HTMLSelectElement;
		expect(select.value).toBe("");
		expect(
			screen
				.getByRole("option", { name: "Select a store" })
				.getAttribute("disabled"),
		).not.toBeNull();

		fireEvent.change(select, { target: { value: "store" } });
		await waitFor(() => expect(onSelect).toHaveBeenCalledWith("store"));
	});

	it("keeps filtered long property names readable in compact layouts", () => {
		render(
			<StoreInspector
				adapters={[{ id: "store", label: "Store" }]}
				selectedAdapterId="store"
				value={encodeValue({ extremelyLongPropertyName: "debug value" })}
				onSelect={() => undefined}
				onRefresh={() => undefined}
			/>,
		);

		fireEvent.change(
			screen.getByRole("textbox", { name: "Filter store properties" }),
			{
				target: { value: "extremelyLong" },
			},
		);

		const key = screen.getByText("extremelyLongPropertyName:", { exact: true });
		expect(key.parentElement?.className).toContain(
			"devtools:@max-[400px]/store-value:flex-col",
		);
		expect(
			screen.getByRole("button", {
				name: "Copy JSON at $.extremelyLongPropertyName",
			}),
		).toBeTruthy();
	});

	it("copies the selected value and nested properties as JSON", async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		const clipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard");
		Object.defineProperty(navigator, "clipboard", {
			configurable: true,
			value: { writeText },
		});
		const value = {
			__ndt_type: "object",
			entries: [["count", 3]],
		} as const;

		try {
			render(
				<StoreInspector
					adapters={[{ id: "store", label: "Store" }]}
					selectedAdapterId="store"
					value={value}
					onSelect={() => undefined}
					onRefresh={() => undefined}
				/>,
			);

			fireEvent.click(
				screen.getByRole("button", {
					name: "Copy JSON at $",
				}),
			);
			await waitFor(() =>
				expect(writeText).toHaveBeenLastCalledWith(
					JSON.stringify(value, null, 2),
				),
			);
			fireEvent.click(
				screen.getByRole("button", {
					name: "Copy JSON at $.count",
				}),
			);
			await waitFor(() => expect(writeText).toHaveBeenLastCalledWith("3"));
			expect((await screen.findByRole("status")).textContent).toBe(
				"Copied JSON at $.count.",
			);
		} finally {
			if (clipboard) {
				Object.defineProperty(navigator, "clipboard", clipboard);
			} else {
				Reflect.deleteProperty(navigator, "clipboard");
			}
		}
	});

	it("announces when clipboard access is unavailable", async () => {
		const clipboard = Object.getOwnPropertyDescriptor(navigator, "clipboard");
		Object.defineProperty(navigator, "clipboard", {
			configurable: true,
			value: {
				writeText: vi.fn().mockRejectedValue(new Error("Permission denied")),
			},
		});

		try {
			render(
				<StoreInspector
					adapters={[{ id: "store", label: "Store" }]}
					selectedAdapterId="store"
					value={3}
					onSelect={() => undefined}
					onRefresh={() => undefined}
				/>,
			);

			fireEvent.click(screen.getByRole("button", { name: "Copy JSON at $" }));
			expect(await screen.findByRole("alert")).toBeTruthy();
			expect(screen.getByRole("alert").textContent).toBe(
				"Could not copy value. Check clipboard permissions.",
			);
		} finally {
			if (clipboard) {
				Object.defineProperty(navigator, "clipboard", clipboard);
			} else {
				Reflect.deleteProperty(navigator, "clipboard");
			}
		}
	});
});
