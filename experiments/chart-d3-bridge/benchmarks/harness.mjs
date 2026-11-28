import { tmpdir } from "node:os";
import { join } from "node:path";

import { chromium } from "playwright";

export const reportPath = (name) => join(tmpdir(), name);

export function proofUrl(query = "") {
  if (!process.env.PROOF_URL) {
    throw new Error("Set PROOF_URL to the running proof server URL");
  }
  const url = new URL(process.env.PROOF_URL);
  if (!["http:", "https:"].includes(url.protocol)) {
    throw new Error("PROOF_URL must use HTTP(S)");
  }
  if (url.pathname === "/") {
    url.pathname = "/experiments/chart-d3-bridge/";
  }
  url.search = query;
  url.hash = "";
  return url.href;
}

export async function launchBenchmark() {
  proofUrl();
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.PROOF_HARDWARE === "1"
      ? {
          channel: "chromium",
          ...(process.platform === "darwin"
            ? { args: ["--use-angle=metal"] }
            : {}),
        }
      : {}),
  });
  // Bounds evaluate and CDP promises as well as stalled frame/worker loops.
  const watchdog = setTimeout(() => {
    console.error("Benchmark exceeded 180 seconds; closing its browser");
    process.exitCode = 1;
    void browser.close();
  }, 180000);
  browser.once("disconnected", () => clearTimeout(watchdog));
  return browser;
}

export async function configurePage(page) {
  page.setDefaultTimeout(30000);
  page.setDefaultNavigationTimeout(30000);
  await page.addInitScript(() => {
    window.benchmarkFrame = () =>
      new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
          cancelAnimationFrame(frame);
          reject(new Error("Animation frame timed out"));
        }, 5000);
        const frame = requestAnimationFrame((time) => {
          clearTimeout(timer);
          resolve(time);
        });
      });
  });
}
