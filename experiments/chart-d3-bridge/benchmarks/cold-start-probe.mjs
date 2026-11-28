import { writeFile } from "node:fs/promises";

import {
  configurePage,
  launchBenchmark,
  proofUrl,
  reportPath,
} from "./harness.mjs";

const browser = await launchBenchmark();
const runs = [];
try {
  for (let trial = 0; trial < 3; trial++) {
    for (const projection of trial % 2 ? ["gpu", "cpu"] : ["cpu", "gpu"]) {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 1100 },
        deviceScaleFactor: 2,
      });
      try {
        const page = await context.newPage();
        await configurePage(page);
        await page.goto(proofUrl(`points=1000000&projection=${projection}`));
        await page.waitForFunction(
          () =>
            document.querySelectorAll('canvas[data-gpu-drawn="1000000"]')
              .length === 2 &&
            document.querySelectorAll('[data-proof-loading="false"]').length ===
              2,
        );
        const navigationReadyObservedMs = await page.evaluate(() =>
          performance.now(),
        );
        await page.waitForFunction(
          () =>
            [...document.querySelectorAll("[data-proof-chart] dd")].length >
              0 &&
            [...document.querySelectorAll("[data-proof-chart] dd")].every(
              (node) => !node.textContent?.includes("Preparing"),
            ),
        );
        const metrics = await page.evaluate(() => ({
          navigationElapsedMs: performance.now(),
          charts: [...document.querySelectorAll("[data-proof-chart] dl")].map(
            (node) =>
              Object.fromEntries(
                [...node.querySelectorAll("div")].map((item) => [
                  item.querySelector("dt")?.textContent,
                  item.querySelector("dd")?.textContent,
                ]),
              ),
          ),
        }));
        await page.screenshot({
          path: reportPath(`doom-cold-${projection}-${trial}.png`),
        });
        runs.push({ trial, projection, navigationReadyObservedMs, ...metrics });
      } finally {
        await context.close();
      }
    }
  }
  const report = {
    notes:
      "Fresh browser context and page per run; shared browser process and warm OS/driver. Server supplied via PROOF_URL. Navigation elapsed is observation latency, not first paint. Data-to-draw ends at CPU submission; screenshots taken after readiness. Two charts, one million points each, DPR 2.",
    runs,
  };
  await writeFile(
    process.argv[2] || reportPath("doom-cold-start.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
