/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi } from "vitest";
import { showcaseCustomPlugin } from "./index";

describe("showcase custom plugin", () => {
	it("has manifest", () => {
		expect(showcaseCustomPlugin.manifest.id).toBe("showcase.custom-inspector");
	});

	it("setup registers panel", () => {
		const panels: unknown[] = [];
		const commands: unknown[] = [];
		const settings: unknown[] = [];
		const layers: unknown[] = [];
		const timeline = {
			emit: () => undefined,
			registerLayer: (l: unknown) => layers.push(l),
		};
		const ctx = {
			panels: { register: (p: unknown) => panels.push(p) },
			commands: { register: (c: unknown) => commands.push(c) },
			settings: { register: (s: unknown) => settings.push(s) },
			timeline,
		} as never;
		showcaseCustomPlugin.setup(ctx);
		expect(panels).toHaveLength(1);
		expect(commands).toHaveLength(1);
		expect(settings).toHaveLength(1);
		expect(layers).toHaveLength(1);
	});

	it("command runs", () => {
		const timeline = { emit: vi.fn(), registerLayer: () => undefined };
		const ctx = {
			panels: { register: () => undefined },
			commands: {
				register: (c: { run: () => void }) => {
					c.run();
				},
			},
			settings: { register: () => undefined },
			timeline,
		} as never;
		showcaseCustomPlugin.setup(ctx);
		expect(timeline.emit).toHaveBeenCalled();
	});
});
