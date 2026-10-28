import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  testIgnore: /production\.spec\.ts/,
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
