import { writeFile } from "node:fs/promises";

import { configurePage, launchBenchmark, proofUrl } from "./harness.mjs";

const backend = process.env.BENCH_BACKEND || "webgpu";
const browser = await launchBenchmark();
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 950 },
    deviceScaleFactor: 1,
  });
  await configurePage(page);
  page.on("console", (message) => {
    if (message.type() === "error" || message.type() === "warning") {
      console.error(message.text());
    }
  });
  // An empty page avoids running a second chart or worker beside the measured renderer.
  await page.route("**/bench-empty.html", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<!doctype html><title>Renderer benchmark</title>",
    }),
  );
  await page.goto(new URL("/bench-empty.html", proofUrl()).href);
  const result = await page.evaluate(
    async ({ backend }) => {
      let device;
      if (backend === "webgpu") {
        const original = GPUAdapter.prototype.requestDevice;
        GPUAdapter.prototype.requestDevice = async function (...args) {
          device = await original.apply(this, args);
          return device;
        };
      }
      const rendererUrl = "/components/Chart/rendering/gpu.ts";
      const rendererSource = await (await fetch(rendererUrl)).text();
      const surfaceUrl = rendererSource.match(
        /from ["']([^"']*webgpu-surface[^"']*)["']/,
      )?.[1];
      const { createGpuPoints } = await import(rendererUrl);
      const { createGpuVector } =
        await import("/components/Chart/rendering/gpu-vector.ts");
      const adapter = await navigator.gpu?.requestAdapter();
      const adapterInfo = adapter
        ? {
            vendor: adapter.info.vendor,
            architecture: adapter.info.architecture,
            device: adapter.info.device,
            description: adapter.info.description,
            isFallbackAdapter: adapter.info.isFallbackAdapter,
          }
        : null;
      const percentile = (values, p) =>
        [...values].sort((a, b) => a - b)[
          Math.floor((values.length - 1) * p)
        ] ?? null;
      const stats = (values) => ({
        medianMs: percentile(values, 0.5),
        p95Ms: percentile(values, 0.95),
        samples: values.length,
      });
      const results = [];
      let renderer;
      for (const workload of [
        { name: "small-scatter", count: 1000 },
        { name: "styled-mixed-points", count: 10000, styled: true },
        { name: "dense-scatter", count: 1000000 },
        { name: "mixed-vector-scatter", count: 10000, mixed: true },
      ]) {
        const positions = new Float32Array(workload.count * 2);
        const radii = workload.styled
          ? new Float32Array(workload.count)
          : undefined;
        for (let i = 0; i < workload.count; i++) {
          positions[i * 2] = ((i * 1664525 + 1013904223) >>> 0) / 4294967296;
          positions[i * 2 + 1] = ((i * 22695477 + 1) >>> 0) / 4294967296;
          if (radii) {
            radii[i] = 1 + (i % 5);
          }
        }
        const data = {
          length: workload.count,
          buffers: () => ({ positions, radii }),
        };
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
          ...(workload.styled
            ? {
                stroke: { color: [0.1, 0.1, 0.1, 1], width: 1 },
                opacity: 0.8,
                pointTransform: [1, 0.2, 0.3, 1],
                emphasis: { indices: [1, 5, 20], opacity: 0.5 },
              }
            : {}),
        };
        const canvas = document.createElement("canvas");
        canvas.width = 1200;
        canvas.height = 700;
        document.body.append(canvas);
        const setupStart = performance.now();
        const vector = workload.mixed ? createGpuVector(canvas) : null;
        const gpu = createGpuPoints(canvas);
        if (backend === "webgpu") {
          await vector?.ready;
          await gpu.ready;
          const deadline = performance.now() + 10000;
          while (!gpu.available && performance.now() < deadline) {
            await new Promise((resolve) => setTimeout(resolve, 5));
          }
          if (!gpu.available) {
            throw new Error(gpu.error || "WebGPU initialization timed out");
          }
        }
        const setupMs = performance.now() - setupStart;
        const gl = backend === "webgl2" ? canvas.getContext("webgl2") : null;
        if (gl) {
          const ext = gl.getExtension("WEBGL_debug_renderer_info");
          renderer = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null;
        }
        const surface =
          backend === "webgpu"
            ? (await import(surfaceUrl)).acquireWebGpuSurface(canvas)
            : null;
        device = surface?.device;
        const readback = device?.createBuffer({
          size: 256,
          usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        });
        const pixel = new Uint8Array(4);
        const complete = async (start) => {
          let queueCompletedMs;
          if (gl) {
            gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
            if (gl.isContextLost() || gl.getError() !== gl.NO_ERROR) {
              throw new Error("WebGL measurement failed");
            }
          } else {
            if (!device) {
              throw new Error("No captured WebGPU device");
            }
            await device.queue.onSubmittedWorkDone();
            queueCompletedMs = performance.now() - start;
            const command = device.createCommandEncoder();
            command.copyTextureToBuffer(
              { texture: surface.main.texture },
              { buffer: readback, bytesPerRow: 256 },
              [1, 1],
            );
            device.queue.submit([command.finish()]);
            await readback.mapAsync(GPUMapMode.READ);
            readback.unmap();
            if (
              !gpu.available ||
              gpu.error ||
              surface.error ||
              (vector && (!vector.available || vector.error))
            ) {
              throw new Error(
                gpu.error ||
                  vector?.error ||
                  surface.error ||
                  "Renderer became unavailable",
              );
            }
          }
          return queueCompletedMs;
        };
        const line = Array.from({ length: 200 }, (_, i) => ({
          x: 20 + i * 5.5,
          y: 350 + 120 * Math.sin(i / 14),
        }));
        const shapes = [
          {
            contours: [
              {
                points: [...line, { x: 1114.5, y: 660 }, { x: 20, y: 660 }],
                closed: true,
              },
            ],
            fill: { color: [0.2, 0.5, 0.7, 0.2] },
          },
          {
            contours: [{ points: line, closed: false }],
            stroke: { color: [0.2, 0.5, 0.7, 1], width: 2 },
          },
          ...Array.from({ length: 30 }, (_, i) => ({
            contours: [
              {
                points: [
                  { x: 25 + i * 36, y: 600 },
                  { x: 45 + i * 36, y: 600 },
                  { x: 45 + i * 36, y: 480 - (i % 5) * 20 },
                  { x: 25 + i * 36, y: 480 - (i % 5) * 20 },
                ],
                closed: true,
              },
            ],
            fill: { color: [0.8, 0.3, 0.2, 0.5] },
          })),
        ];
        const draw = (source, nextView) => {
          if (vector) {
            surface?.beginFrame(canvas.width, canvas.height);
            vector.draw(
              shapes.map((shape) => ({
                ...shape,
                transform: {
                  a: nextView.k,
                  b: 0,
                  c: 0,
                  d: nextView.k,
                  e: nextView.x,
                  f: nextView.y,
                },
              })),
              {
                width: 1200,
                height: 700,
                ratio: 1,
                clip: { x: 20, y: 20, width: 1160, height: 660 },
              },
            );
          }
          gpu.draw(source, vector ? { ...nextView, clear: false } : nextView);
          if (vector) {
            surface?.endFrame();
          }
        };
        const firstStart = performance.now();
        draw(data, view);
        const firstSubmissionMs = performance.now() - firstStart;
        const firstQueueCompletedWallMs = await complete(firstStart);
        const firstCompletedWallMs = performance.now() - firstStart;
        const phases = {};
        for (const phase of ["initial-upload", "update-256", "panzoom"]) {
          const cpu = [],
            completed = [],
            frames = [],
            queueCompleted = [];
          let previous;
          for (let i = -5; i < 60; i++) {
            const frame = await window.benchmarkFrame();
            if (i > 0) {
              frames.push(frame - previous);
            }
            previous = frame;
            let source = data;
            if (phase === "initial-upload") {
              source = { ...data };
            }
            if (phase === "update-256") {
              for (let j = 0; j < 256; j++) {
                positions[j * 2] = (positions[j * 2] + 0.001) % 1;
              }
            }
            const start = performance.now();
            if (phase === "update-256") {
              gpu.patch(Array.from({ length: 256 }, (_, j) => j));
            }
            draw(
              source,
              phase === "panzoom"
                ? {
                    ...view,
                    k: 1.4 + 0.3 * Math.sin(i / 15),
                    x: -100 + 70 * Math.sin(i / 11),
                    y: -60 + 40 * Math.cos(i / 13),
                  }
                : view,
            );
            const submit = performance.now() - start;
            const queueMs = await complete(start);
            const done = performance.now() - start;
            if (i >= 0) {
              if (queueMs !== undefined) {
                queueCompleted.push(queueMs);
              }
              cpu.push(submit);
              completed.push(done);
            }
          }
          phases[phase] = {
            cpuSubmission: stats(cpu),
            completedWall: stats(completed),
            ...(queueCompleted.length
              ? { queueCompletedWall: stats(queueCompleted) }
              : {}),
            rafInterval: stats(frames),
          };
        }
        readback?.destroy();
        surface?.release();
        gpu.dispose();
        vector?.dispose();
        gl?.getExtension("WEBGL_lose_context")?.loseContext();
        canvas.remove();
        results.push({
          ...workload,
          setupMs,
          firstDraw: {
            cpuSubmissionMs: firstSubmissionMs,
            completedWallMs: firstCompletedWallMs,
            queueCompletedWallMs: firstQueueCompletedWallMs,
          },
          phases,
        });
      }
      return { adapterInfo, webglRenderer: renderer, results };
    },
    { backend },
  );
  const output = {
    date: new Date().toISOString(),
    backend,
    browser: browser.version(),
    hardwareRequested: process.env.PROOF_HARDWARE === "1",
    canvas: "1200x700 DPR1",
    revision: process.env.BENCH_REVISION || "working-tree",
    notes:
      "Renderer only; excludes React, axes, indexing, tooltip and data preparation. 5 warmups then 60 samples per phase. Initial-upload replaces source identity on an initialized renderer (setup reported separately). CPU submission is not GPU time. Completed wall includes CPU submission and WebGL readPixels(1x1) / WebGPU queue.onSubmittedWorkDone plus texture copy/map(1x1); these synchronization methods differ and readback overhead is included. RAF intervals include scheduling and synchronization, not presentation timestamps. Styled mixed-points is a point-style workload. Mixed-vector-scatter draws 30 bars, a 200-vertex line and area, plus 10k points through shared vector/point renderers (MSAA4); excludes React Chart bookkeeping. No isolated GPU timestamps.",
    ...result,
  };
  await writeFile(
    process.argv[2] || `/tmp/doom-${backend}-comparison.json`,
    JSON.stringify(output, null, 2),
  );
  console.log(JSON.stringify(output));
} finally {
  await browser.close();
}
