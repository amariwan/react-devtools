/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ToastProvider, ToastViewport } from "./toast";

describe("Toast", () => {
	it("renders provider", () => {
		const { container } = render(
			<ToastProvider>
				<ToastViewport />
			</ToastProvider>,
		);
		expect(container.firstChild).toBeTruthy();
	});
});
