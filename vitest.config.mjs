import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { transformWithEsbuild } from "vite";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  plugins: [{
    name: "jsx-pages",
    enforce: "pre",
    transform(code, id) {
      if (/\/(app|components)\/.*\.js$/.test(id)) return transformWithEsbuild(code, id, { loader: "jsx", jsx: "automatic" });
    },
  }, react()],
  resolve: { alias: { "@": root } },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.js"],
    include: ["tests/unit/**/*.test.{js,jsx}", "tests/component/**/*.test.{js,jsx}"],
  },
});
