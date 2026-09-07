import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    globals: true,
    include: ["tests/package/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**"],
  },
});
