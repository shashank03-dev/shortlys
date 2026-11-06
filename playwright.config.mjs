import { defineConfig, devices } from "@playwright/test";
import { testEnvironment } from "./scripts/test-env.mjs";

Object.assign(process.env, testEnvironment("e2e"));

const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const chromium = executablePath
  ? { ...devices["Desktop Chrome"], launchOptions: { executablePath } }
  : { ...devices["Desktop Chrome"], channel: "chromium" };
const mobile = executablePath
  ? { ...devices["Pixel 7"], launchOptions: { executablePath } }
  : { ...devices["Pixel 7"], channel: "chromium" };

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30000,
  fullyParallel: false,
  workers: 1,
  retries: 1,
  reporter: [["list"]],
  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "npm run build && npm run start -- --port 3100",
    url: "http://localhost:3100",
    reuseExistingServer: false,
    timeout: 180000,
  },
  projects: [
    { name: "chromium", use: chromium },
    { name: "mobile", use: mobile },
  ],
});
