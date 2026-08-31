import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

/**
 * Real-browser lane.
 *
 * The default suite runs in happy-dom, which has no layout engine: every
 * getBoundingClientRect() returns 0x0 at the origin, so coordinate translation
 * is arithmetically invisible there and computed CSS custom properties never
 * resolve. These tests cover exactly what that environment cannot see.
 */
export default defineConfig({
  test: {
    include: ["components/**/*.browser.test.tsx"],
    browser: {
      enabled: true,
      provider: playwright(),
      headless: true,
      screenshotFailures: false,
      instances: [{ browser: "chromium" }],
    },
  },
});
