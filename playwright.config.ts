import { defineConfig, devices } from "@playwright/test";
import { readFileSync } from "node:fs";

const pkg = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8")) as {
  name: string;
};
const appName = pkg.name;
const PORT = Number(process.env["PLAYWRIGHT_PORT"] ?? 4173);
const baseURL = `http://localhost:${PORT}/${appName}/`;

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  // WebRTC's BroadcastChannel fallback is intentionally exercised by the
  // two-peer suite. Serial workers keep that shared-browser transport
  // deterministic both locally and on Woodpecker, whose workers do not set
  // a universal `CI` environment variable.
  workers: 1,
  reporter: process.env["CI"] ? "list" : [["list"], ["json", { outputFile: "test-results.json" }]],
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    actionTimeout: 5_000,
    navigationTimeout: 10_000,
  },
  webServer: {
    // Build (cheap when up-to-date) + preview, so tests always run against
    // the current source — never a stale docs/.
    command: `npm run build && npx vite preview --host 127.0.0.1 --port ${PORT} --strictPort`,
    url: baseURL,
    reuseExistingServer: !process.env["CI"],
    timeout: 60_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
