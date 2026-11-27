import { writeFile } from "node:fs/promises";

import { chromium, firefox, webkit } from "playwright";

const results = [];
for (const [name, engine, options] of [
  ["chromium", chromium, {}],
  [
    "chromium-metal",
    chromium,
    { channel: "chromium", args: ["--use-angle=metal"] },
  ],
  ["firefox", firefox, {}],
  [
    "firefox-webgpu-prefs",
    firefox,
    {
      firefoxUserPrefs: {
        "dom.webgpu.enabled": true,
        "gfx.webgpu.ignore-blocklist": true,
      },
    },
  ],
  ["webkit", webkit, {}],
]) {
  let browser;
  try {
    browser = await engine.launch({ headless: true, ...options });
    const page = await browser.newPage();
    await page.route("**/backend-probe.html", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: "<!doctype html><title>Adapter probe</title>",
      }),
    );
    await page.goto(
      new URL(
        "/backend-probe.html",
        process.env.PROOF_URL || "http://127.0.0.1:63419/",
      ).href,
    );
    results.push({
      name,
      version: browser.version(),
      ...(await page.evaluate(async () => {
        const adapter = await navigator.gpu?.requestAdapter();
        const canvas = document.createElement("canvas");
        const gl = canvas.getContext("webgl2");
        const debug = gl?.getExtension("WEBGL_debug_renderer_info");
        return {
          secure: isSecureContext,
          webgpu: !!navigator.gpu,
          adapter: !!adapter,
          adapterInfo: adapter
            ? {
                vendor: adapter.info.vendor,
                architecture: adapter.info.architecture,
                device: adapter.info.device,
                description: adapter.info.description,
                isFallbackAdapter: adapter.info.isFallbackAdapter,
              }
            : null,
          features: adapter ? [...adapter.features] : [],
          webglRenderer: debug
            ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
            : null,
        };
      })),
    });
  } catch (error) {
    results.push({ name, error: String(error) });
  } finally {
    await browser?.close();
  }
}
const output = JSON.stringify(
  { date: new Date().toISOString(), platform: process.platform, results },
  null,
  2,
);
await writeFile(process.argv[2] || "/tmp/doom-backend-probe.json", output);
console.log(output);
