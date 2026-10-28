import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/browser",
  testMatch: /production\.spec\.ts/,
  use: {
    baseURL: "http://localhost:3000",
    headless: true,
  },
  webServer: {
    command:
      "bun run --filter next16-devtools-showcase build && bun run --filter next16-devtools-showcase start",
    url: "http://localhost:3000",
    reuseExistingServer: false,
    timeout: 180000,
  },
});
