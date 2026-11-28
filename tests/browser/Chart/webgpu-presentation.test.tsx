import { expect, it } from "vitest";

import {
  createGpuPoints,
  type GpuView,
} from "../../../components/Chart/rendering/gpu";
import { compositedPixel } from "./composited-pixel";
import { hasWebGpu, readGpuPixel } from "./webgpu-readback";

it("presents successive GPU updates to the visible canvas", async ({
  skip,
}) => {
  if (!(await hasWebGpu())) {
    skip();
  }
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 80;
  document.body.append(canvas);
  const gpu = createGpuPoints(canvas);
  try {
    await gpu.ready;
    const positions = new Float32Array([0.5, 0.5]);
    const data = { length: 1, buffers: () => ({ positions }) };
    const view: GpuView = {
      width: 80,
      height: 80,
      plotWidth: 80,
      plotHeight: 80,
      k: 1,
      x: 0,
      y: 0,
      matrix: new DOMMatrix(),
      ratio: 1,
      radius: 12,
      color: [1, 0, 0, 1],
    };
    const bounds = canvas.getBoundingClientRect();
    for (const color of [
      [1, 0, 0, 1],
      [0, 0, 1, 1],
      [0, 1, 0, 1],
    ]) {
      gpu.draw(data, { ...view, color });
      const expected = color.map((channel) => channel * 255);
      expect(await readGpuPixel(canvas, 40, 40)).toEqual(expected);
      await expect
        .poll(() => compositedPixel(bounds.left + 40, bounds.top + 40), {
          timeout: 5000,
        })
        .toEqual(expected);
    }
  } finally {
    gpu.dispose();
    canvas.remove();
  }
});
