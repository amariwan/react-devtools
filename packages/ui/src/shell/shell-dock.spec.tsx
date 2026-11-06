/**
 * @vitest-environment jsdom
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Dock } from "./shell-dock";

describe("Dock", () => {
	it("centers a 70% wide bottom dock without resizing the host app", () => {
		render(<Dock>content</Dock>);
		const dock = screen.getByRole("region", { name: "Next.js DevTools" });
		expect(dock.getAttribute("data-dock")).toBe("bottom");
		expect(dock.style.width).toBe("70%");
		expect(dock.style.marginInline).toBe("auto");
		expect(dock.style.height).toContain("70dvh");
		expect(screen.getByText("content")).toBeTruthy();
	});

	it("supports accessible keyboard resizing in all dock directions", () => {
		const { rerender } = render(<Dock size={50} position="bottom" />);
		const separator = screen.getByRole("separator", {
			name: "Resize DevTools",
		});
		expect(separator.getAttribute("aria-orientation")).toBe("horizontal");
		fireEvent.keyDown(separator, { key: "ArrowUp" });
		expect(separator.getAttribute("aria-valuenow")).toBe("55");
		fireEvent.keyDown(separator, { key: "Home" });
		expect(separator.getAttribute("aria-valuenow")).toBe("35");
		fireEvent.keyDown(separator, { key: "End" });
		expect(separator.getAttribute("aria-valuenow")).toBe("94");

		rerender(<Dock size={50} position="left" />);
		expect(separator.getAttribute("aria-orientation")).toBe("vertical");
		fireEvent.keyDown(separator, { key: "ArrowLeft" });
		expect(separator.getAttribute("aria-valuenow")).toBe("89");

		rerender(<Dock size={50} position="right" />);
		fireEvent.keyDown(separator, { key: "ArrowLeft" });
		expect(separator.getAttribute("aria-valuenow")).toBe("94");
	});

	it("resizes a side dock by dragging and stops after pointer cancellation", () => {
		render(<Dock position="left" />);
		const dock = screen.getByRole("region", { name: "Next.js DevTools" });
		const separator = screen.getByRole("separator", {
			name: "Resize DevTools",
		});
		const capture = () => undefined;
		separator.setPointerCapture = capture;

		fireEvent.pointerDown(separator, { button: 0, pointerId: 1, clientX: 200 });
		fireEvent.pointerMove(separator, { pointerId: 1, clientX: 300 });
		expect(dock.style.width).not.toContain("70vw");
		expect(Number(separator.getAttribute("aria-valuenow"))).toBeGreaterThan(70);

		fireEvent.pointerCancel(separator, { pointerId: 1 });
		const stoppedAt = separator.getAttribute("aria-valuenow");
		fireEvent.pointerMove(separator, { pointerId: 1, clientX: 400 });
		expect(separator.getAttribute("aria-valuenow")).toBe(stoppedAt);
	});
});
