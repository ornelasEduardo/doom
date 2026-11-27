import { expect, it } from "vitest";
import { server } from "vitest/browser";

import { hasWebGpu } from "./webgpu-readback";

it("requires a WebGPU adapter in the Chromium rendering lane", async ({
  skip,
}) => {
  if (server.browser !== "chromium") {
    skip();
  }
  expect(await hasWebGpu()).toBe(true);
});
