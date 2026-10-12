import { writeFile } from "node:fs/promises";

import {
  configurePage,
  launchBenchmark,
  proofUrl,
  reportPath,
} from "./harness.mjs";

const browser = await launchBenchmark();
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1100 },
  });
  await configurePage(page);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(proofUrl(`points=1000`));
  await page.waitForFunction(
    () => document.querySelectorAll('[data-proof-count="1000"]').length === 2,
  );
  await page.getByLabel("Points per chart", { exact: true }).click();
  await page.evaluate(() => {
    window.loadProbe = {
      start: performance.now(),
      first: null,
      ready: null,
      gaps: [],
      previous: null,
      active: true,
    };
    const p = window.loadProbe;
    const sample = (now) => {
      if (!p.active) {
        return;
      }
      if (p.previous !== null) {
        p.gaps.push(now - p.previous);
      }
      p.previous = now;
      const nodes = Array.from(document.querySelectorAll("[data-proof-count]"));
      if (
        nodes.length === 2 &&
        nodes.every((n) => n.getAttribute("data-proof-count") === "1000000") &&
        document.querySelectorAll('canvas[data-gpu-drawn="1000000"]').length ===
          2
      ) {
        p.first ??= now - p.start;
        if (
          document.querySelectorAll('[data-proof-loading="false"]').length === 2
        ) {
          p.ready ??= now - p.start;
        }
      }
      requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  await page.getByRole("option", { name: "1,000,000", exact: true }).click();
  await page.waitForFunction(
    () => window.loadProbe.ready !== null,
    {},
    { timeout: 120000 },
  );
  const result = await page.evaluate(() => {
    const p = window.loadProbe;
    p.active = false;
    const sorted = p.gaps.slice().sort((a, b) => a - b);
    return {
      drawSubmissionObservedAtFrameMs: p.first,
      interactionReadyMs: p.ready,
      maxFrameGapMs: sorted.at(-1),
      frameP95Ms: sorted[Math.floor(sorted.length * 0.95)],
      samples: sorted.length,
    };
  });
  await page.locator("[data-chart-container]").first().focus();
  await page.keyboard.press("ArrowRight");
  const tooltip = await page
    .locator("[data-chart-tooltip]")
    .first()
    .innerText();
  await writeFile(
    process.argv[2] || reportPath("doom-load.json"),
    JSON.stringify(
      {
        notes:
          "Server supplied via PROOF_URL. Native selector change; draw submission and readiness detected at RAF boundaries, not compositor timestamps. Two charts switching 1k to 1M each.",
        result,
        tooltip,
        errors,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify({ result, tooltip, errors }));
} finally {
  await browser.close();
}
