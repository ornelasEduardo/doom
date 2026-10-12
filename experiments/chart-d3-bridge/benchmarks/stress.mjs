import { writeFile } from "node:fs/promises";

import {
  configurePage,
  launchBenchmark,
  proofUrl,
  reportPath,
} from "./harness.mjs";

async function runStress() {
  const output = process.argv[2] || reportPath("doom-d3-stress-results.json");
  const sizes = (process.env.PROOF_SIZES || "1000,5000,10000,25000,50000")
    .split(",")
    .map(Number);
  const supported = [
    8, 1000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000,
  ];
  if (!sizes.length || sizes.some((count) => !supported.includes(count))) {
    throw new Error("PROOF_SIZES must contain supported point counts");
  }
  const browser = await launchBenchmark();
  const results = [];
  const modes = ["webgl"];
  const percentile = (values, p) => {
    if (!values.length) {
      return null;
    }
    const sorted = [...values].sort((a, b) => a - b);
    return (
      Math.round(
        (sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ||
          0) * 10,
      ) / 10
    );
  };
  try {
    for (const mode of modes) {
      for (const count of sizes) {
        const page = await browser.newPage({
          viewport: { width: 1440, height: 950 },
        });
        await configurePage(page);

        const errors = [];
        page.on("pageerror", (error) => {
          errors.push(error.message);
          console.error(error.message);
        });
        const start = performance.now();
        await page.goto(proofUrl(`points=${count}`));
        await page.waitForFunction(
          (expected) =>
            Array.from(document.querySelectorAll("[data-proof-count]")).reduce(
              (sum, node) =>
                sum + Number(node.getAttribute("data-proof-count")),
              0,
            ) === expected,
          count * 2,
        );
        await page.evaluate(() =>
          window.benchmarkFrame().then(() => window.benchmarkFrame()),
        );
        const mountMs = Math.round(performance.now() - start);
        await page.evaluate(() => {
          window.proofMeasurements = {
            frames: [],
            hover: [],
            active: true,
            last: null,
            pending: null,
          };
          const m = window.proofMeasurements;
          const sample = (now) => {
            if (!m.active) {
              return;
            }
            if (m.last !== null) {
              m.frames.push(now - m.last);
            }
            m.last = now;
            requestAnimationFrame(sample);
          };
          requestAnimationFrame(sample);
          document.addEventListener(
            "pointermove",
            (m.onPointer = () => {
              m.pending = performance.now();
            }),
            { capture: true },
          );
          const observer = new MutationObserver(() => {
            if (m.pending === null) {
              return;
            }
            const sent = m.pending;
            m.pending = null;
            requestAnimationFrame(() => m.hover.push(performance.now() - sent));
          });
          document.querySelectorAll(".chart-markers-layer").forEach((layer) =>
            observer.observe(layer, {
              childList: true,
              attributes: true,
              subtree: true,
            }),
          );
          m.observer = observer;
        });
        const plots = await page
          .locator("[data-chart-inner-plot]")
          .evaluateAll((nodes) =>
            nodes.map((node) => {
              const box = node.getBoundingClientRect();
              return {
                x: box.x,
                y: box.y,
                width: box.width,
                height: box.height,
              };
            }),
          );
        const profiler = process.env.PROOF_PROFILE
          ? await page.context().newCDPSession(page)
          : null;
        if (profiler) {
          await profiler.send("Profiler.enable");
          await profiler.send("Profiler.start");
          await profiler.send("Tracing.start", {
            categories: "devtools.timeline",
            transferMode: "ReturnAsStream",
          });
        }
        const moveStart = performance.now();
        for (let index = 0; index < 90; index++) {
          const box = plots[Math.floor(index / 15) % 2];
          await page.mouse.move(
            box.x + box.width * (0.15 + (index % 15) / 20),
            box.y + box.height * (0.3 + 0.2 * Math.sin(index)),
          );
          await page.waitForTimeout(8);
        }
        const moveMs = Math.round(performance.now() - moveStart);
        if (profiler) {
          const { profile } = await profiler.send("Profiler.stop");
          await writeFile(
            `${output}.${mode}.${count}.cpuprofile`,
            JSON.stringify(profile),
          );
          const completed = new Promise((resolve) =>
            profiler.once("Tracing.tracingComplete", resolve),
          );
          await profiler.send("Tracing.end");
          const { stream } = await completed;
          let trace = "";
          while (true) {
            const chunk = await profiler.send("IO.read", { handle: stream });
            trace += chunk.data;
            if (chunk.eof) {
              break;
            }
          }
          await profiler.send("IO.close", { handle: stream });
          await writeFile(`${output}.${mode}.${count}.trace.json`, trace);
          await profiler.detach();
        }
        const samples = await page.evaluate(() => {
          const m = window.proofMeasurements;
          m.active = false;
          m.observer.disconnect();
          document.removeEventListener("pointermove", m.onPointer, true);
          return { frames: m.frames, hover: m.hover };
        });
        await page.waitForFunction(
          () => !document.querySelector('[data-proof-loading="true"]'),
        );
        const root = page.locator(
          "[data-proof-chart='Primary'] [data-chart-container]",
        );
        await root.focus();
        const keyboard = [];
        for (let i = 0; i < 5; i++) {
          const start = performance.now();
          await page.keyboard.press("ArrowRight");
          await page.evaluate(() =>
            window.benchmarkFrame().then(() => window.benchmarkFrame()),
          );
          keyboard.push(performance.now() - start);
        }
        const updateStart = performance.now();
        const firstMark = page
          .locator("[data-proof-chart='Primary'] [data-proof-surface]")
          .first();
        const oldY = await firstMark.getAttribute("data-proof-first-y");
        await page
          .getByRole("button", { name: "Update data", exact: true })
          .click();
        await page.waitForFunction(
          (old) =>
            !!document.querySelector(
              "[data-proof-chart='Primary'] [data-proof-surface]",
            ) &&
            document
              .querySelector(
                "[data-proof-chart='Primary'] [data-proof-surface]",
              )
              .getAttribute("data-proof-first-y") !== old,
          oldY,
        );
        await page.evaluate(() =>
          window.benchmarkFrame().then(() => window.benchmarkFrame()),
        );
        const updateMs = Math.round(performance.now() - updateStart);
        const zoomStart = performance.now();
        await page
          .getByRole("button", { name: "Zoom in Primary", exact: true })
          .click();
        await page.waitForFunction(() =>
          document
            .querySelector("[data-proof-chart='Primary'] output")
            ?.textContent?.includes("2.00"),
        );
        await page.evaluate(() =>
          window.benchmarkFrame().then(() => window.benchmarkFrame()),
        );
        const zoomMs = Math.round(performance.now() - zoomStart);
        let wheel = null;
        if (process.env.PROOF_WHEEL) {
          await page.mouse.move(
            plots[0].x + plots[0].width / 2,
            plots[0].y + plots[0].height / 2,
          );
          await page.evaluate(() => {
            window.wheelFrames = { active: true, times: [], last: null };
            const sample = (now) => {
              const m = window.wheelFrames;
              if (!m.active) {
                return;
              }
              if (m.last !== null) {
                m.times.push(now - m.last);
              }
              m.last = now;
              requestAnimationFrame(sample);
            };
            requestAnimationFrame(sample);
          });
          const start = performance.now();
          for (let i = 0; i < 24; i++) {
            await page.mouse.wheel(0, i % 12 < 6 ? -20 : 20);
            await page.waitForTimeout(16);
          }
          await page.evaluate(() =>
            window.benchmarkFrame().then(() => window.benchmarkFrame()),
          );
          const frames = await page.evaluate(() => {
            window.wheelFrames.active = false;
            return window.wheelFrames.times;
          });
          wheel = {
            durationMs: Math.round(performance.now() - start),
            samples: frames.length,
            frameP95Ms: percentile(frames, 0.95),
            frameP99Ms: percentile(frames, 0.99),
            framesOver50ms: frames.filter((n) => n > 50).length,
          };
        }
        const details = await page.evaluate(() => {
          const canvas = document.querySelector(
            "[data-proof-chart='Primary'] canvas",
          );
          const gl = canvas?.getContext("webgl2");
          const debug = gl?.getExtension("WEBGL_debug_renderer_info");
          const phases = Array.from(
            document.querySelectorAll("[data-proof-geometry-ms]"),
          ).map((node) => ({
            preparationMs: node.hasAttribute("data-proof-preparation-ms")
              ? Number(node.getAttribute("data-proof-preparation-ms"))
              : null,
            drawSubmitMs: Number(
              node.getAttribute("data-proof-draw-submit-ms"),
            ),
            geometryMs: Number(node.getAttribute("data-proof-geometry-ms")),
          }));
          return {
            gpu: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : null,
            phases,
          };
        });
        const memorySession = await page.context().newCDPSession(page);
        const memory = await memorySession.send("Runtime.getHeapUsage");
        await memorySession.detach();
        const result = {
          renderer: mode,
          pointsPerChart: count,
          totalPoints: count * 2,
          mountMs,
          hoverSweepMs: moveMs,
          frameP95Ms: percentile(samples.frames, 0.95),
          framesOver50ms: samples.frames.filter((n) => n > 50).length,
          hoverUpdateP95Ms: percentile(samples.hover, 0.95),
          hoverSamples: samples.hover.length,
          keyboardP95Ms: percentile(keyboard, 0.95),
          keyboardColdMs: keyboard[0],
          keyboardWarmP95Ms: percentile(keyboard.slice(1), 0.95),
          updateMs,
          zoomMs,
          wheel,
          ...details,
          jsHeapUsedMB: Math.round(memory.usedSize / 1e6),
          jsHeapAllocatedMB: Math.round(memory.totalSize / 1e6),
          // Nominal XY storage per canvas; excludes CPU/index/density allocations.
          nominalGpuXYBufferMB: (count * 2 * 8) / 1e6,
          errors,
        };
        results.push(result);
        console.log(JSON.stringify(result));
        await writeFile(
          output,
          JSON.stringify(
            {
              browser: process.env.PROOF_HARDWARE
                ? "Chromium headless, requested Metal backend; see gpu for actual device"
                : "Chromium headless shell",
              viewport: "1440x950",
              notes:
                "Server supplied via PROOF_URL, two charts using the selected renderer. Mount includes navigation/module load. Keyboard/update/zoom include Playwright and two RAFs. Hover is native pointer to marker mutation plus RAF; frame gaps sampled during 90 sequential native moves with 8ms driver pacing. Local measurements, not capacity guarantees.",
              results,
            },
            null,
            2,
          ),
        );
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }
}

await runStress();
