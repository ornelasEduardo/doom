import { defineConfig } from "vitest/config";

import base from "../../vitest.chart-browser.config";

export default defineConfig({
  ...base,
  cacheDir: ".cache/vitest-chart-proof",
  optimizeDeps: {
    include: ["d3-selection", "d3-transition", "d3-zoom", "react-dom"],
  },
  test: {
    ...base.test,
    include: ["experiments/chart-d3-bridge/*.browser.test.tsx"],
    // Adapter/device startup and shader compilation can exceed the default 1s
    // poll budget on CI's software GPU, even for an eight-point chart.
    expect: {
      ...base.test?.expect,
      poll: { ...base.test?.expect?.poll, timeout: 5000 },
    },
    browser: {
      ...base.test?.browser,
      api: { port: 63418, strictPort: true },
      commands: {
        ...base.test?.browser?.commands,
        async zoomProofWheel({ page, frame }) {
          const chart = (await frame()).locator(
            "[data-proof-chart='Primary'] [data-chart-inner-plot]",
          );
          await chart.hover();
          await page.mouse.wheel(0, -160);
        },
      },
    },
  },
});
declare module "vitest/browser" {
  interface BrowserCommands {
    zoomProofWheel(): Promise<void>;
  }
}
