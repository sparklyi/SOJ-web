import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    environment: "jsdom",
    exclude: ["**/node_modules/**", "**/.next/**", "tests/e2e/**"],
    globals: true,
    setupFiles: ["./tests/setup.ts"],
  },
});
