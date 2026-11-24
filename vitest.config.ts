import { defineConfig } from "vitest/config";

export default defineConfig({
  cacheDir: ".cache/vitest",
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    exclude: [
      "**/node_modules/**",
      "**/*.test [0-9].ts",
      "**/*.test [0-9].tsx",
      // Real-browser lane — run with `npm run test:browser`.
      "**/*.browser.test.tsx",
      "**/dist/**",
      "tests/**",
      "**/.worktrees/**",
    ],
  },
});
