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
  const runs = await page.evaluate(async () => {
    // Module-import probes require the Vite development server.
    const moduleUrl = new URL(
      "/experiments/chart-d3-bridge/compact-world.ts",
      location.origin,
    ).href;
    const url = URL.createObjectURL(
      new Blob(
        [
          `
      import { prepareCompact } from ${JSON.stringify(moduleUrl)};
      onmessage = ({ data: encoding }) => {
        const start = performance.now();
        const buffers = prepareCompact(1000000, 1, encoding);
        const grid = buffers.grid;
        postMessage({ encoding, totalMs: performance.now() - start,
          ...buffers.timings, bytes: buffers.values.byteLength + buffers.positions.byteLength +
          grid.coordinates.byteLength + grid.heads.byteLength + grid.next.byteLength + grid.previous.byteLength });
      };`,
        ],
        { type: "text/javascript" },
      ),
    );
    const runs = [];
    try {
      for (let round = 0; round < 5; round++) {
        for (const encoding of round % 2
          ? ["raw", "projected"]
          : ["projected", "raw"]) {
          runs.push(
            await new Promise((resolve, reject) => {
              const worker = new Worker(url, { type: "module" });
              const cleanup = () => {
                clearTimeout(timer);
                worker.terminate();
              };
              const timer = setTimeout(() => {
                cleanup();
                reject(new Error("Preparation worker timed out"));
              }, 10000);
              worker.onmessage = ({ data }) => {
                cleanup();
                resolve({ round, ...data });
              };
              worker.onerror = (event) => {
                cleanup();
                reject(new Error(event.message));
              };
              worker.onmessageerror = () => {
                cleanup();
                reject(new Error("Invalid preparation worker message"));
              };
              worker.postMessage(encoding);
            }),
          );
        }
      }
    } finally {
      URL.revokeObjectURL(url);
    }
    return runs;
  });
  const report = {
    notes:
      "Supported raw/projected preparation, one fresh worker per run. Timings start inside worker after module imports and exclude worker startup/transport. Vite development server required.",
    runs,
  };
  await writeFile(
    process.argv[2] || reportPath("doom-preparation.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report));
} finally {
  await browser.close();
}
