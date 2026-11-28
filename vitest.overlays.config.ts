import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

import base from "./vitest.browser.config";

export default defineConfig({
  ...base,
  test: {
    ...base.test,
    include: ["tests/browser/Overlays/*.test.tsx"],
    browser: {
      ...base.test!.browser,
      provider: playwright(),
      instances: [
        { browser: "chromium" },
        { browser: "firefox" },
        { browser: "webkit" },
      ],
    },
  },
});
