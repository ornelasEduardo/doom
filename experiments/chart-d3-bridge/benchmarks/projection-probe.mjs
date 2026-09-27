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
    viewport: { width: 1280, height: 900 },
  });
  await configurePage(page);
  await page.goto(proofUrl("points=8"));
  const results = await page.evaluate(async () => {
    const { createGpuPoints } =
      await import("/experiments/chart-d3-bridge/gpu.ts");
    const runs = [];
    for (const distribution of ["linear", "log", "clustered"]) {
      const generationStart = performance.now();
      const values = new Float32Array(2000000);
      let seed = 923451;
      for (let i = 0; i < values.length; i++) {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        const unit = seed / 4294967296;
        values[i] =
          distribution === "log"
            ? 10 ** (unit * 3)
            : distribution === "clustered"
              ? ((i % 3) - 1) * 60 + unit * 10
              : unit * 200 - 100;
      }
      const generationMs = performance.now() - generationStart;
      const axes =
        distribution === "log"
          ? {
              x: { type: "log", domain: [1, 1000] },
              y: { type: "log", domain: [1000, 1] },
            }
          : {
              x: { type: "linear", domain: [-100, 100] },
              y: { type: "linear", domain: [100, -100] },
            };
      for (let trial = 0; trial < 3; trial++) {
        for (const mode of trial % 2
          ? ["raw", "projected"]
          : ["projected", "raw"]) {
          const start = performance.now();
          let positions = values;
          if (mode === "projected") {
            positions = new Float32Array(values.length);
            for (let i = 0; i < values.length; i += 2) {
              positions[i] =
                distribution === "log"
                  ? Math.log10(values[i]) / 3
                  : (values[i] + 100) / 200;
              positions[i + 1] =
                distribution === "log"
                  ? 1 - Math.log10(values[i + 1]) / 3
                  : (100 - values[i + 1]) / 200;
            }
          }
          const prepared = performance.now();
          const canvas = document.createElement("canvas");
          canvas.width = 1000;
          canvas.height = 600;
          canvas.style.cssText = "position:fixed;inset:0;z-index:999";
          document.body.append(canvas);
          let gpu;
          try {
            gpu = createGpuPoints(canvas);
            const gl = canvas.getContext("webgl2");
            const initialized = performance.now();
            const timer = gl.getExtension("EXT_disjoint_timer_query_webgl2");
            const query = timer ? gl.createQuery() : null;
            if (query) {
              gl.beginQuery(timer.TIME_ELAPSED_EXT, query);
            }
            const source = {
              immutable: true,
              length: values.length / 2,
              buffers: () => ({ positions }),
            };
            const view = {
              width: 1000,
              height: 600,
              plotWidth: 1000,
              plotHeight: 600,
              k: 1,
              x: 0,
              y: 0,
              matrix: new DOMMatrix(),
              ratio: 1,
              radius: 1.5,
              color: [0.5, 0.2, 0.8, 1],
              axes: mode === "raw" ? axes : undefined,
            };
            gpu.draw(source, view);
            if (query) {
              gl.endQuery(timer.TIME_ELAPSED_EXT);
            }
            const submitted = performance.now();
            if (gl.getError() !== gl.NO_ERROR) {
              throw new Error("Invalid GPU draw");
            }
            const fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
            if (!fence) {
              throw new Error("GPU fence unavailable");
            }
            gl.flush();
            while (true) {
              const status = gl.clientWaitSync(fence, 0, 0);
              if (
                status === gl.ALREADY_SIGNALED ||
                status === gl.CONDITION_SATISFIED
              ) {
                break;
              }
              if (
                status === gl.WAIT_FAILED ||
                performance.now() - submitted > 3000
              ) {
                throw new Error("GPU completion failed");
              }
              await new Promise((resolve) => setTimeout(resolve, 0));
            }
            const completed = performance.now();
            const gpuMs =
              query &&
              gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE) &&
              !gl.getParameter(timer.GPU_DISJOINT_EXT)
                ? gl.getQueryParameter(query, gl.QUERY_RESULT) / 1e6
                : null;
            let frameP95Ms = null;
            if (trial === 1) {
              const frames = [];
              let previous;
              for (let frame = 0; frame < 46; frame++) {
                const now = await window.benchmarkFrame();
                if (previous !== undefined) {
                  frames.push(now - previous);
                }
                previous = now;
                const k = 1 + 0.2 * Math.sin(frame / 10);
                gpu.draw(source, {
                  ...view,
                  k,
                  x: (1 - k) * 500,
                  y: (1 - k) * 300,
                });
              }
              frameP95Ms = frames.sort((a, b) => a - b)[
                Math.floor(frames.length * 0.95)
              ];
            }
            runs.push({
              frameP95Ms,
              distribution,
              mode,
              trial,
              generationMs,
              projectionMs: prepared - start,
              setupMs: initialized - prepared,
              submitMs: submitted - initialized,
              totalSubmitMs: submitted - start,
              completionObservedMs: completed - start,
              gpuMs,
            });
            if (query) {
              gl.deleteQuery(query);
            }
            gl.deleteSync(fence);
          } finally {
            gpu?.dispose();
            canvas
              .getContext("webgl2")
              ?.getExtension("WEBGL_lose_context")
              ?.loseContext();
            canvas.remove();
          }
          await window.benchmarkFrame();
        }
      }
    }
    return runs;
  });
  const notes =
    "Vite development server required. Renderer-only supplied-data probe. Source generation is reported separately and excluded from timed renderer work. Each run creates a new WebGL context, but the browser, modules, and GPU driver are already warm. Excludes Chart, indexing, network, and physical first paint. Fence observation includes polling latency.";
  console.log(notes);
  await writeFile(
    process.argv[2] || reportPath("doom-projection-probe.json"),
    JSON.stringify({ notes, runs: results }, null, 2),
  );
  for (const distribution of ["linear", "log", "clustered"]) {
    for (const mode of ["projected", "raw"]) {
      const rows = results.filter(
        (r) => r.distribution === distribution && r.mode === mode,
      );
      const median = (key) => rows.map((r) => r[key]).sort((a, b) => a - b)[1];
      console.log({
        distribution,
        mode,
        frameP95Ms: rows.find((row) => row.frameP95Ms !== null)?.frameP95Ms,
        generationMs: median("generationMs"),
        projectionMs: median("projectionMs"),
        setupMs: median("setupMs"),
        submitMs: median("submitMs"),
        totalSubmitMs: median("totalSubmitMs"),
        completionObservedMs: median("completionObservedMs"),
        gpuMs: median("gpuMs"),
      });
    }
  }
} finally {
  await browser.close();
}
