/**
 * @vitest-environment jsdom
 */
import {
	createCoreRuntimeServices,
	createPluginRegistry,
} from "@next-devtools/core";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DevtoolsShell } from "./shell";

describe("DevtoolsShell", () => {
	it("renders disabled", () => {
		const store: Record<string, string> = {};
		(window as unknown as { localStorage: Storage }).localStorage = {
			getItem: (k: string) => store[k] ?? null,
			setItem: (k: string, v: string) => {
				store[k] = v;
			},
			removeItem: (k: string) => {
				delete store[k];
			},
			clear: () => {},
			key: () => null,
			length: 0,
		};
		const services = createCoreRuntimeServices();
		const registry = createPluginRegistry({ runtimeServices: services });
		const { container } = render(
			<DevtoolsShell registry={registry} enabled={false} />,
		);
		expect(container).toBeTruthy();
		services.dispose();
	});
});
