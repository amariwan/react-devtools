/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { vi } from "vitest";
import { DevtoolsLauncher } from "./shell-launcher";

describe("DevtoolsLauncher", () => {
	it("renders", () => {
		render(
			<DevtoolsLauncher onOpen={() => undefined} onPick={() => undefined} />,
		);
		expect(screen.getByLabelText("Open Next.js DevTools")).toBeTruthy();
	});

	it("opens immediately on pointer down", () => {
		const onOpen = vi.fn();
		render(<DevtoolsLauncher onOpen={onOpen} onPick={() => undefined} />);

		fireEvent.pointerDown(
			screen.getByRole("button", { name: "Open Next.js DevTools" }),
		);

		expect(onOpen).toHaveBeenCalledOnce();
	});

	it.each(["Enter", " "])("opens on %s key activation", (key) => {
		const onOpen = vi.fn();
		render(<DevtoolsLauncher onOpen={onOpen} onPick={() => undefined} />);

		fireEvent.keyDown(
			screen.getByRole("button", { name: "Open Next.js DevTools" }),
			{ key },
		);

		expect(onOpen).toHaveBeenCalledOnce();
	});

	it("reveals the picker when keyboard focus enters the launcher", () => {
		const onPick = vi.fn();
		render(<DevtoolsLauncher onOpen={() => undefined} onPick={onPick} />);

		fireEvent.focus(
			screen.getByRole("button", { name: "Open Next.js DevTools" }),
		);
		fireEvent.click(screen.getByRole("button", { name: "Pick element" }));

		expect(onPick).toHaveBeenCalledOnce();
	});
});
