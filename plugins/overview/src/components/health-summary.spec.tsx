/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HealthSummary } from "./health-summary";

describe("HealthSummary", () => {
	it("renders", () => {
		const { container } = render(
			<HealthSummary issues={[]} diagnosticCount={0} />,
		);
		expect(container).toBeTruthy();
	});
});
