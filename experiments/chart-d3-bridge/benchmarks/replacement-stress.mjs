import { writeFile } from "node:fs/promises";

import {
  configurePage,
  launchBenchmark,
  proofUrl,
  reportPath,
} from "./harness.mjs";

const projection = process.env.PROOF_PROJECTION || "gpu";
if (!["cpu", "gpu"].includes(projection)) {
  throw new Error("PROOF_PROJECTION must be cpu or gpu");
}
const browser = await launchBenchmark();
try {
  const page = await browser.newPage();
  await configurePage(page);
  await page.goto(proofUrl(`points=1000&projection=${projection}`));
  await page.waitForFunction(
    () =>
      document.querySelectorAll('[data-proof-loading="false"]').length === 2,
  );
  const runs = [];
  for (let round = 0; round < 4; round++) {
    const prior = await page
      .locator("[data-proof-ready-at]")
      .evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("data-proof-ready-at")),
      );
    const start = performance.now();
    if (round === 0) {
      await page.getByLabel("Points per chart", { exact: true }).click();
      await page
        .getByRole("option", { name: "1,000,000", exact: true })
        .click();
    } else {
      await page
        .getByRole("button", { name: "Update data", exact: true })
        .click();
    }
    await page.waitForFunction((previous) => {
      const nodes = [...document.querySelectorAll("[data-proof-ready-at]")];
      return (
        document.querySelectorAll('[data-proof-count="1000000"]').length ===
          2 &&
        document.querySelectorAll('[data-proof-loading="false"]').length ===
          2 &&
        nodes.length === 2 &&
        nodes.every(
          (node, index) =>
            node.getAttribute("data-proof-ready-at") !== previous[index],
        )
      );
    }, prior);
    const readinessObservedMs = performance.now() - start;
    await page.waitForFunction(() => {
      const values = [...document.querySelectorAll("[data-proof-chart] dd")];
      return (
        values.length === 12 &&
        values.every((node) => !node.textContent?.includes("Preparing"))
      );
    });
    runs.push({
      round,
      readinessObservedMs,
      reported: await page
        .locator("[data-proof-chart] dl")
        .evaluateAll((nodes) =>
          nodes.map((node) =>
            Object.fromEntries(
              [...node.querySelectorAll("div")].map((item) => [
                item.querySelector("dt")?.textContent,
                item.querySelector("dd")?.textContent,
              ]),
            ),
          ),
        ),
      charts: await page.locator("[data-proof-ready-at]").evaluateAll((nodes) =>
        nodes.map((node) =>
          Object.fromEntries(
            ["preparation-ms", "index-ms", "draw-submit-ms"].map((key) => {
              const value = node.getAttribute(`data-proof-${key}`);
              return [key, value === null ? null : Number(value)];
            }),
          ),
        ),
      ),
    });
  }
  const report = {
    projection,
    notes:
      "Both charts must publish new ready timestamps. Readiness includes Playwright input and observation latency; preparation/index/draw are per-chart reported phases. No compositor paint claim.",
    runs,
  };
  await writeFile(
    process.argv[2] || reportPath("doom-replacement.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report));
} finally {
  await browser.close();
}
