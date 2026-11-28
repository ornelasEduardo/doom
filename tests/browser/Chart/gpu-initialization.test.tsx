import { expect, it, vi } from "vitest";

import { registerGpuMark } from "../../../components/Chart/rendering/scene";
import { hasWebGpu } from "./webgpu-readback";

it("keeps pending adapter initialization distinct from rendering failure", async ({
  skip,
}) => {
  if (!(await hasWebGpu())) {
    skip();
  }
  const adapter = await navigator.gpu.requestAdapter();
  let resolveAdapter!: (adapter: GPUAdapter | null) => void;
  const request = vi.spyOn(navigator.gpu, "requestAdapter").mockReturnValue(
    new Promise((resolve) => {
      resolveAdapter = resolve;
    }),
  );
  const host = document.createElement("div");
  host.innerHTML =
    '<svg width="100" height="100"><circle data-chart-gpu-mark="point" cx="50" cy="50" r="8" fill="red" /></svg>';
  document.body.append(host);
  const release = registerGpuMark(host.querySelector("circle")!, {
    kind: "point",
    x: 50,
    y: 50,
    radius: 8,
  });
  try {
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
    expect(host.querySelector("canvas")?.dataset.chartGpu).toBe("preparing");
    expect(host.querySelector('[role="status"]')).toBeNull();
    resolveAdapter(adapter);
    await expect
      .poll(() => host.querySelector("canvas")?.dataset.chartGpu, {
        timeout: 5000,
      })
      .toBe("ready");
    expect(host.querySelector('[role="status"]')).toBeNull();
  } finally {
    request.mockRestore();
    resolveAdapter(adapter);
    release();
    host.remove();
  }
});
