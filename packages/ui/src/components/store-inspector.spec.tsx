/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
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
	});
});
