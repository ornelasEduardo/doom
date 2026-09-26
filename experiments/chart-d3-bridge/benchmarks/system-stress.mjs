import { writeFile } from "node:fs/promises";

import {
  configurePage,
  launchBenchmark,
  proofUrl,
  reportPath,
} from "./harness.mjs";

const browser = await launchBenchmark();
try {
  const page = await browser.newPage();
  await configurePage(page);
  await page.goto(proofUrl("points=8"));
  const result = await page.evaluate(async () => {
    const { buildGrid, PreparedGrid } =
      await import("/components/Chart/engine/PreparedGrid.ts");
    const { prepareCompact, adoptCompact } =
      await import("/experiments/chart-d3-bridge/compact-world.ts");
    const { createGpuPoints } =
      await import("/experiments/chart-d3-bridge/gpu.ts");
    const buffers = prepareCompact(1000000),
      world = adoptCompact(buffers);
    const coordinates = buffers.grid.coordinates;
    const index = [];
    for (let round = 0; round < 6; round++) {
      for (const explicit of round % 2 ? [true, false] : [false, true]) {
        const start = performance.now();
        buildGrid(
          coordinates,
          128,
          explicit ? { minX: 0, minY: 0, width: 1, height: 1 } : undefined,
        );
        index.push({ explicit, ms: performance.now() - start });
      }
    }
    const hover = [];
    for (const filter of [false, true]) {
      let records = 0,
        hits = 0;
      const grid = new PreparedGrid(
        {
          length: 1000000,
          seriesId: "s",
          get(i) {
            records++;
            return {
              dataIndex: i,
              seriesId: "s",
              x: coordinates[i * 2],
              y: coordinates[i * 2 + 1],
              data: i,
            };
          },
        },
        buffers.grid,
      );
      const start = performance.now();
      for (let i = 0; i < 500; i++) {
        const x = ((i * 7919) % 1000) / 1000,
          y = ((i * 3571) % 1000) / 1000,
          radius = 0.008;
        const accepts = (px, py) => Math.hypot(px - x, py - y) <= radius;
        grid.query(
          x - radius,
          y - radius,
          x + radius,
          y + radius,
          (p) => {
            if (accepts(p.x, p.y)) {
              hits++;
            }
          },
          filter ? accepts : undefined,
        );
      }
      hover.push({ filter, ms: performance.now() - start, records, hits });
    }
    const densityStart = performance.now();
    const pyramid = world.density();
    const densityBuildMs = performance.now() - densityStart;
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
      const timer = gl.getExtension("EXT_disjoint_timer_query_webgl2");
      const debug = gl.getExtension("WEBGL_debug_renderer_info");
      const backend = debug
        ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
        : null;
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
      const render = [];
      for (const detail of ["exact", "density", "density", "exact"]) {
        const gpuTimes = [],
          queries = [];
        const submissions = [],
          completed = [],
          bins = [];
        for (let i = 0; i < 31; i++) {
          await window.benchmarkFrame();
          const k = 1 + i / 60,
            x = (-(k - 1) * view.plotWidth) / 2,
            y = (-(k - 1) * view.plotHeight) / 2;
          const start = performance.now();
          const density =
            detail === "density"
              ? pyramid.view(
                  {
                    x: -x / (view.plotWidth * k),
                    y: -y / (view.plotHeight * k),
                    width: 1 / k,
                    height: 1 / k,
                  },
                  Math.ceil(view.plotWidth / 8),
                )
              : undefined;
          const query = timer ? gl.createQuery() : null;
          if (query) {
            gl.beginQuery(timer.TIME_ELAPSED_EXT, query);
          }
          gpu.draw(world, { ...view, k, x, y, density });
          if (query) {
            gl.endQuery(timer.TIME_ELAPSED_EXT);
            queries.push(query);
          }
          const submitted = performance.now();
          if (gl.getError() !== gl.NO_ERROR) {
            throw new Error("GPU draw failed");
          }
          const fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
          if (!fence) {
            throw new Error("GPU fence unavailable");
          }
          gl.flush();
          const deadline = performance.now() + 2000;
          while (true) {
            const status = gl.clientWaitSync(fence, 0, 0);
            if (
              status === gl.ALREADY_SIGNALED ||
              status === gl.CONDITION_SATISFIED
            ) {
              break;
            }
            if (status === gl.WAIT_FAILED || performance.now() > deadline) {
              throw new Error("GPU completion unavailable");
            }
            await new Promise((resolve) => setTimeout(resolve, 0));
          }
          gl.deleteSync(fence);
          if (i) {
            submissions.push(submitted - start);
            completed.push(performance.now() - start);
            bins.push(Number(canvas.dataset.gpuDrawn));
          }
        }
        for (const query of queries) {
          if (
            gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE) &&
            !gl.getParameter(timer.GPU_DISJOINT_EXT)
          ) {
            gpuTimes.push(gl.getQueryParameter(query, gl.QUERY_RESULT) / 1e6);
          }
          gl.deleteQuery(query);
        }
        const percentile = (values, p) =>
          [...values].sort((a, b) => a - b)[
            Math.floor((values.length - 1) * p)
          ];
        render.push({
          detail,
          submitMedianMs: percentile(submissions, 0.5),
          gpuMedianMs: gpuTimes.length ? percentile(gpuTimes, 0.5) : null,
          gpuSamples: gpuTimes.length,
          completionObservedMedianMs: percentile(completed, 0.5),
          completionObservedP95Ms: percentile(completed, 0.95),
          drawn: bins.at(-1),
        });
      }
      return { backend, index, hover, densityBuildMs, render };
    } finally {
      gpu?.dispose();
      canvas
        .getContext("webgl2")
        ?.getExtension("WEBGL_lose_context")
        ?.loseContext();
      canvas.remove();
    }
  });
  await writeFile(
    process.argv[2] || reportPath("doom-system-stress.json"),
    JSON.stringify(result, null, 2),
  );
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
