import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    fileParallelism: false,
    projects: [
      { extends: "./vitest.config.mjs", test: { name: "unit" } },
      { extends: "./vitest.integration.config.mjs", test: { name: "integration" } },
    ],
    coverage: {
      provider: "v8",
      include: ["lib/**/*.js", "app/api/**/*.js"],
      exclude: ["lib/prisma.js", "lib/mongodb.js"],
      reporter: ["text", "json-summary", "html"],
      thresholds: { lines: 80 },
    },
  },
});
