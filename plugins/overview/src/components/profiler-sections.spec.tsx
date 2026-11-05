/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProfilerSections } from "./profiler-sections";

describe("ProfilerSections", () => {
	it("renders", () => {
		const { container } = render(
			<ProfilerSections
				comparison={null}
				profiler={
					{
						commits: [],
						totalActualDuration: 0,
						maxActualDuration: 0,
						ranked: [],
					} as never
				}
			/>,
		);
		expect(container).toBeTruthy();
	});
});
