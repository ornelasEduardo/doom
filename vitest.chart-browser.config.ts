import { defineConfig } from "vitest/config";

import browserConfig from "./vitest.browser.config";

export default defineConfig({
  ...browserConfig,
  cacheDir: ".cache/vitest-chart-browser",
  test: {
    ...browserConfig.test,
    include: ["tests/browser/Chart/**/*.test.tsx"],
    browser: {
      ...browserConfig.test?.browser,
      instances: [
        { browser: "chromium" },
        // CDP dispatches native touch only in Chromium; core input and
        // lifecycle coverage still runs in every engine.
        { browser: "firefox", exclude: ["tests/browser/Chart/touch.test.tsx"] },
        { browser: "webkit", exclude: ["tests/browser/Chart/touch.test.tsx"] },
      ],
    },
  },
});
