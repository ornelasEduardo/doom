import { defineConfig } from "vitest/config";

import base from "../../vitest.chart-browser.config";

export default defineConfig({
  ...base,
  test: {
    ...base.test,
    include: ["experiments/chart-dashboards/*.browser.test.tsx"],
    browser: { ...base.test?.browser, api: { port: 63449, strictPort: true } },
  },
});
