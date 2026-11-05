/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ComponentRuntimeStatus } from "./component-runtime-status";

describe("ComponentRuntimeStatus", () => {
	it("renders unavailable", () => {
		const { container } = render(
			<ComponentRuntimeStatus
				available={false}
				unavailableReason="no"
				suspense={{}}
			/>,
		);
		expect(container).toBeTruthy();
	});
});
