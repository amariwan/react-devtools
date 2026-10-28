import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://localhost:3001", headless: true },
  webServer: {
    command: "npx next dev -p 3001",
    url: "http://localhost:3001",
    reuseExistingServer: true,
    timeout: 120000,
    cwd: ".",
    env: process.env as Record<string, string>,
  },
});
