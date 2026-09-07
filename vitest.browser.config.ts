import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

import { moveChartPointer } from "./tests/browser/Chart/coordinateCommands";

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
    include: ["tests/browser/**/*.test.tsx"],
    browser: {
      enabled: true,
      commands: { moveChartPointer },
      provider: playwright(),
      headless: true,
      commands: {
        async setReducedMotion(
          { page },
          preference: "reduce" | "no-preference",
        ) {
          await page.emulateMedia({ reducedMotion: preference });
        },
      },
      screenshotFailures: false,
      // A desktop viewport by default: the runner's own window is narrow
      // enough to read as mobile, which would mask any container-vs-viewport
      // responsive behaviour.
      viewport: { width: 1280, height: 800 },
      instances: [{ browser: "chromium" }],
    },
  },
});
