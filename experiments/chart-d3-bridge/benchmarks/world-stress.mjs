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
  await page.goto(proofUrl("points=1000000"));
  await page.waitForFunction(
    () =>
      Array.from(document.querySelectorAll("[data-proof-count]")).reduce(
        (sum, node) => sum + Number(node.getAttribute("data-proof-count")),
        0,
      ) === 2000000,
  );
  await page.waitForFunction(
    () => !document.querySelector('[data-proof-loading="true"]'),
  );
  const session = await page.context().newCDPSession(page);
  await session.send("HeapProfiler.collectGarbage");
  const before = await session.send("Runtime.getHeapUsage");
  await page
    .locator("[data-proof-chart='Primary'] [data-chart-container]")
    .focus();
  await page.keyboard.press("ArrowRight");
  const results = [];
  for (const viewport of ["full", "Primary zoomed 8x"]) {
    if (viewport !== "full") {
      for (let i = 0; i < 3; i++) {
        await page.getByRole("button", { name: "Zoom in Primary" }).click();
      }
      await page.waitForFunction(() =>
        document
          .querySelector("[data-proof-chart='Primary'] output")
          ?.textContent?.includes("8.00"),
      );
    }
    for (const count of [1, 100, 10000]) {
      await page.getByLabel("Points to edit", { exact: true }).click();
      await page
        .getByRole("option", {
          name: count.toLocaleString("en-US"),
          exact: true,
        })
        .click();
      await page
        .locator("[data-proof-chart='Primary'] [data-chart-container]")
        .focus();
      await page.keyboard.press("Escape");
      await page.keyboard.press("ArrowRight");
      await page.evaluate(async () => {
        Array.from(document.querySelectorAll("button"))
          .find((b) => b.textContent === "Edit points")
          .click();
        await window.benchmarkFrame().then(() => window.benchmarkFrame());
      });
      const samples = [];
      for (let repeat = 0; repeat < 5; repeat++) {
        samples.push(
          await page.evaluate(async () => {
            const start = performance.now();
            Array.from(document.querySelectorAll("button"))
              .find((b) => b.textContent === "Edit points")
              .click();
            const submitMs = performance.now() - start;
            await window.benchmarkFrame().then(() => window.benchmarkFrame());
            return {
              changed: Number(
                document
                  .querySelector('[aria-label="Incremental update result"]')
                  .textContent.split(" points")[0]
                  .replaceAll(",", ""),
              ),
              submitMs,
              throughTwoFramesMs: performance.now() - start,
              charts: Array.from(
                document.querySelectorAll("[data-proof-chart]"),
              ).map((chart) => ({
                name: chart.getAttribute("data-proof-chart"),
                indexPatchMs: Number(
                  chart
                    .querySelector("[data-proof-patch-ms]")
                    ?.getAttribute("data-proof-patch-ms"),
                ),
                gpuPatched: Number(
                  chart
                    .querySelector("canvas")
                    ?.getAttribute("data-gpu-patched"),
                ),
                gpuDeferred: Number(
                  chart.querySelector("canvas")?.getAttribute("data-gpu-dirty"),
                ),
                tooltip:
                  chart.querySelector("[data-chart-tooltip]")?.textContent ??
                  null,
              })),
            };
          }),
        );
      }
      if (samples.some((sample) => sample.changed !== count)) {
        throw new Error("Benchmark edit count mismatch");
      }
      const p95 = (key) => samples.map((s) => s[key]).sort((a, b) => a - b)[4];
      const result = {
        viewport,
        changedPerChart: count,
        submitP95Ms: p95("submitMs"),
        throughTwoFramesP95Ms: p95("throughTwoFramesMs"),
        samples,
      };
      results.push(result);
      console.log(JSON.stringify(result));
    }
  }
  await session.send("HeapProfiler.collectGarbage");
  const after = await session.send("Runtime.getHeapUsage");
  const gpu = await page.evaluate(() => {
    const gl = document.querySelector("canvas").getContext("webgl2");
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null;
  });
  await writeFile(
    process.argv[2] || reportPath("doom-world-million.json"),
    JSON.stringify(
      {
        notes:
          "Server supplied via PROOF_URL, 2x1M points, fixed axes and existing latency edits. Five repetitions per case. Submission includes both index patches and React scheduling; throughTwoFrames includes two RAFs, not GPU timer queries. GPU patch counts describe the last draw. Heap after explicit GC; baseline precedes first keyboard navigation.",
        gpu,
        heapBeforeMB: before.usedSize / 1e6,
        heapAfterMB: after.usedSize / 1e6,
        errors,
        results,
      },
      null,
      2,
    ),
  );
  await session.detach();
  await page.screenshot({
    path: reportPath("doom-world-million-preview.png"),
    fullPage: true,
  });
} finally {
  await browser.close();
}
