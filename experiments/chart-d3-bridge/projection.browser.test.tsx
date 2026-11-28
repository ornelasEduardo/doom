import { beforeEach, expect, it, vi } from "vitest";

import { createGpuPoints } from "../../components/Chart/rendering/gpu";
import { acquireWebGpuSurface } from "../../components/Chart/rendering/webgpu-surface";
import {
  hasWebGpu,
  readGpuPixel,
} from "../../tests/browser/Chart/webgpu-readback";

it("projects supplied numeric data on the GPU and changes domains without reuploading", async () => {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 200;
  const gpu = createGpuPoints(canvas);
  await gpu.ready;
  const surface = acquireWebGpuSurface(canvas);
  const upload = vi.spyOn(surface.device.queue, "writeBuffer");
  surface.release();
  const positions = new Float32Array([-5, 100, 5, 10]);
  const source = { length: 2, buffers: () => ({ positions }) };
  const view = {
    width: 200,
    height: 200,
    plotWidth: 200,
    plotHeight: 200,
    k: 1,
    x: 0,
    y: 0,
    matrix: new DOMMatrix(),
    ratio: 1,
    radius: 4,
    color: [1, 0, 0, 1],
    axes: {
      x: { type: "linear" as const, domain: [-10, 10] as const },
      y: { type: "log" as const, domain: [1000, 1] as const },
    },
  };
  const pixel = (x: number, y: number) => readGpuPixel(canvas, x, y);
  try {
    gpu.draw(source, view);
    expect(await pixel(50, 67)).toEqual([255, 0, 0, 255]);
    expect(await pixel(150, 133)).toEqual([255, 0, 0, 255]);
    gpu.draw(source, {
      ...view,
      axes: { ...view.axes, x: { type: "linear", domain: [-20, 20] } },
    });
    expect(await pixel(75, 67)).toEqual([255, 0, 0, 255]);
    expect((await pixel(50, 67))[3]).toBe(0);
    expect(
      upload.mock.calls.filter(
        ([buffer]) => buffer.label === "Chart point buffer",
      ),
    ).toHaveLength(1);
    expect(gpu.error).toBeUndefined();
  } finally {
    upload.mockRestore();
    gpu.dispose();
  }
});

it("shares immutable numeric storage across renderers without permitting stale patches", async () => {
  const positions = new Float32Array([0.25, 0.25]);
  const source = {
    length: 1,
    immutable: true as const,
    buffers: () => ({ positions }),
  };
  const view = {
    width: 100,
    height: 100,
    plotWidth: 100,
    plotHeight: 100,
    k: 1,
    x: 0,
    y: 0,
    matrix: new DOMMatrix(),
    ratio: 1,
    radius: 4,
    color: [1, 0, 0, 1],
  };
  const renderers = await Promise.all(
    [document.createElement("canvas"), document.createElement("canvas")].map(
      async (canvas) => {
        canvas.width = canvas.height = 100;
        const renderer = createGpuPoints(canvas);
        await renderer.ready;
        const surface = acquireWebGpuSurface(canvas);
        const upload = vi.spyOn(surface.device.queue, "writeBuffer");
        surface.release();
        return { renderer, upload };
      },
    ),
  );
  try {
    for (const { renderer, upload } of renderers) {
      renderer.draw(source, view);
      expect(
        upload.mock.calls.find(
          ([buffer]) => buffer.label === "Chart point buffer",
        )?.[2],
      ).toBe(positions.buffer);
      expect(() => renderer.patch([0])).toThrow(/immutable/i);
    }
    expect(Array.from(positions)).toEqual([0.25, 0.25]);
  } finally {
    for (const { renderer, upload } of renderers) {
      upload.mockRestore();
      renderer.dispose();
    }
  }
});

it("creates a ready WebGPU pipeline without synchronous shader polling", async () => {
  const canvas = document.createElement("canvas");
  const gpu = createGpuPoints(canvas);
  try {
    await gpu.ready;
    expect(gpu.available).toBe(true);
    expect(gpu.error).toBeUndefined();
  } finally {
    gpu.dispose();
  }
});

it("restores real GPU resources and replays the newest frame after device loss", async () => {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 100;
  const gpu = createGpuPoints(canvas);
  await gpu.ready;
  const surface = acquireWebGpuSurface(canvas);
  const view = {
    width: 100,
    height: 100,
    plotWidth: 100,
    plotHeight: 100,
    k: 1,
    x: 0,
    y: 0,
    matrix: new DOMMatrix(),
    ratio: 1,
    radius: 4,
    color: [1, 0, 0, 1],
  };
  const source = (value: number) => ({
    length: 1,
    buffers: () => ({ positions: new Float32Array([value, value]) }),
  });
  try {
    gpu.draw(source(0.25), view);
    expect(await readGpuPixel(canvas, 25, 25)).toEqual([255, 0, 0, 255]);
    surface.device.destroy();
    await expect.poll(() => gpu.available).toBe(false);
    gpu.draw(source(0.75), view);
    gpu.recover();
    await expect.poll(() => gpu.available).toBe(true);
    await expect
      .poll(() => readGpuPixel(canvas, 75, 75))
      .toEqual([255, 0, 0, 255]);
    expect(gpu.error).toBeUndefined();
  } finally {
    surface.release();
    gpu.dispose();
  }
});

beforeEach(async ({ skip }) => {
  if (!(await hasWebGpu())) {
    skip();
  }
});
