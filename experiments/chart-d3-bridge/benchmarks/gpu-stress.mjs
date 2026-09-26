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
    viewport: { width: 1440, height: 950 },
  });
  await configurePage(page);
  await page.goto(proofUrl("points=8"));
  const result = await page.evaluate(async () => {
    const { createGpuPoints } =
      await import("/experiments/chart-d3-bridge/gpu.ts");
    const { prepareCompact, adoptCompact } =
      await import("/experiments/chart-d3-bridge/compact-world.ts");
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 700;
    canvas.style.cssText =
      "position:fixed;inset:0;z-index:999;background:white";
    document.body.append(canvas);
    let gpu;
    try {
      gpu = createGpuPoints(canvas);
      const gl = canvas.getContext("webgl2");
      const debug = gl.getExtension("WEBGL_debug_renderer_info");
      const timer = gl.getExtension("EXT_disjoint_timer_query_webgl2");
      const backend = debug
        ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
        : null;
      const dataStart = performance.now();
      const data = adoptCompact(prepareCompact(1000000, 0, "projected"));
      const preparationMs = performance.now() - dataStart;
      const view = {
        width: 1200,
        height: 700,
        plotWidth: 1160,
        plotHeight: 660,
        k: 1,
        x: 0,
        y: 0,
        matrix: new DOMMatrix().translate(20, 20),
        ratio: 1,
        radius: 1.5,
        color: [0.55, 0.25, 0.9, 1],
      };
      const uploadStart = performance.now();
      gpu.draw(data, view);
      const initialSubmitMs = performance.now() - uploadStart;
      const frames = [],
        submissions = [],
        queries = [];
      let previous;
      for (let i = 0; i < 120; i++) {
        const now = await window.benchmarkFrame();
        if (previous !== undefined) {
          frames.push(now - previous);
        }
        previous = now;
        const query = timer ? gl.createQuery() : null;
        if (query) {
          gl.beginQuery(timer.TIME_ELAPSED_EXT, query);
        }
        const start = performance.now();
        gpu.draw(data, {
          ...view,
          k: 1.4 + 0.3 * Math.sin(i / 15),
          x: -100 + 70 * Math.sin(i / 11),
          y: -60 + 40 * Math.cos(i / 13),
        });
        submissions.push(performance.now() - start);
        if (query) {
          gl.endQuery(timer.TIME_ELAPSED_EXT);
          queries.push(query);
        }
      }
      const elapsed = [],
        deadline = performance.now() + 5000;
      let disjoint = false;
      while (queries.length && performance.now() < deadline) {
        await window.benchmarkFrame();
        if (gl.getParameter(timer.GPU_DISJOINT_EXT)) {
          disjoint = true;
          break;
        }
        while (
          queries.length &&
          gl.getQueryParameter(queries[0], gl.QUERY_RESULT_AVAILABLE)
        ) {
          elapsed.push(gl.getQueryParameter(queries[0], gl.QUERY_RESULT) / 1e6);
          gl.deleteQuery(queries.shift());
        }
      }
      queries.forEach((q) => gl.deleteQuery(q));
      const p = (values, fraction) =>
        [...values].sort((a, b) => a - b)[
          Math.floor((values.length - 1) * fraction)
        ] ?? null;
      const result = {
        points: data.length,
        backend,
        canvas: "1200x700 DPR1",
        preparationMs,
        initialSubmitMs,
        frameP50Ms: p(frames, 0.5),
        frameP95Ms: p(frames, 0.95),
        frameP99Ms: p(frames, 0.99),
        framesOver8_33Ms: frames.filter((n) => n > 1000 / 120).length,
        framesOver16_67Ms: frames.filter((n) => n > 1000 / 60).length,
        frames: frames.length,
        submitP95Ms: p(submissions, 0.95),
        gpuP95Ms: disjoint ? null : p(elapsed, 0.95),
        gpuSamples: elapsed.length,
        gpuDisjoint: disjoint,
        error: gl.getError(),
      };
      return result;
    } finally {
      gpu?.dispose();
      canvas
        .getContext("webgl2")
        ?.getExtension("WEBGL_lose_context")
        ?.loseContext();
      canvas.remove();
    }
  });
  const output = {
    notes:
      "Vite development server required. Renderer-only diagnostic: one million resident points, 120 animated pan/zoom frames. Excludes Chart geometry indexing, axes, and tooltip. Frame timing includes browser scheduling; GPU timing only when disjoint timer queries are available. Server supplied via PROOF_URL.",
    result,
  };
  await writeFile(
    process.argv[2] || reportPath("doom-gpu-render-only.json"),
    JSON.stringify(output, null, 2),
  );
  console.log(JSON.stringify(output));
} finally {
  await browser.close();
}
