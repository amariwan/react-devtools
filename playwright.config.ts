import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: "./tests/browser",
	testIgnore: /production\.e2e\.spec\.ts/,
	retries: 2,
	timeout: 60000,
	workers: 2,
	use: {
		baseURL: "http://localhost:3000",
		headless: true,
	},
	webServer: {
		command: "bun run --filter next16-devtools-showcase dev",
		url: "http://localhost:3000",
		reuseExistingServer: true,
		timeout: 180000,
	},
});
