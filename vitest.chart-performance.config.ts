import { defineConfig } from "vitest/config";

import browserConfig from "./vitest.browser.config";

export default defineConfig({
  ...browserConfig,
  cacheDir: ".cache/vitest-chart-performance",
  test: {
    ...browserConfig.test,
    include: ["tests/benchmarks/Chart/**/*.test.tsx"],
    fileParallelism: false,
    reporters: ["verbose"],
    silent: false,
    browser: {
      ...browserConfig.test?.browser,
      instances: [{ browser: "chromium" }],
    },
  },
});
