import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    exclude: [
      "**/node_modules/**",
      // Real-browser lane — run with `npm run test:browser`.
      "**/*.browser.test.tsx",
      "**/dist/**",
      "tests/**",
      "**/.worktrees/**",
    ],
  },
});
