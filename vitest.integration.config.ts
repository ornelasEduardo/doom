import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    globals: true,
    // Integration tests should ONLY look at the tests/ folder
    include: ["tests/**/*.test.ts"],
    // We don't exclude tests/ here because that's what we want to run!
    exclude: ["**/node_modules/**", "**/dist/**"],
  },
});
