import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import { testEnvironment } from "./scripts/test-env.mjs";

Object.assign(process.env, testEnvironment("integration"), { NEXT_PUBLIC_APP_URL: "http://localhost:3000" });
const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: { alias: { "@": root } },
  test: {
    environment: "node",
    globals: true,
    include: ["tests/integration/**/*.test.js"],
    setupFiles: ["./tests/integration/setup.js"],
    fileParallelism: false,
    testTimeout: 30000,
  },
});
