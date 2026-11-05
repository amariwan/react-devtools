/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DevtoolsProvider } from "./provider";

describe("DevtoolsProvider", () => {
	it("renders children when disabled", () => {
		const { container } = render(
			<DevtoolsProvider enabled={false}>
				<span>hi</span>
			</DevtoolsProvider>,
		);
		expect(container).toBeTruthy();
	});
});
