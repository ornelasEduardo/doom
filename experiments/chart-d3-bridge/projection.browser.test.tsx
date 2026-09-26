import { expect, it, vi } from "vitest";

import { createGpuPoints } from "./gpu";

it("projects supplied numeric data on the GPU and changes domains without reuploading", () => {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 200;
  const gpu = createGpuPoints(canvas);
  const gl = canvas.getContext("webgl2")!;
  const upload = vi.spyOn(gl, "bufferData");
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
  const pixel = (x: number, y: number) => {
    const rgba = new Uint8Array(4);
    gl.readPixels(x, 199 - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, rgba);
    return Array.from(rgba);
  };
  try {
    gpu.draw(source, view);
    expect(pixel(50, 67)).toEqual([255, 0, 0, 255]);
    expect(pixel(150, 133)).toEqual([255, 0, 0, 255]);
    gpu.draw(source, {
      ...view,
      axes: { ...view.axes, x: { type: "linear", domain: [-20, 20] } },
    });
    expect(pixel(75, 67)).toEqual([255, 0, 0, 255]);
    expect(pixel(50, 67)[3]).toBe(0);
    expect(upload).toHaveBeenCalledTimes(1);
    expect(gl.getError()).toBe(gl.NO_ERROR);
  } finally {
    upload.mockRestore();
    gpu.dispose();
  }
});

it("shares immutable numeric storage across renderers without permitting stale patches", () => {
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
  const renderers = [
    document.createElement("canvas"),
    document.createElement("canvas"),
  ].map((canvas) => {
    canvas.width = canvas.height = 100;
    const renderer = createGpuPoints(canvas);
    return {
      renderer,
      upload: vi.spyOn(canvas.getContext("webgl2")!, "bufferData"),
    };
  });
  try {
    for (const { renderer, upload } of renderers) {
      renderer.draw(source, view);
      expect(upload.mock.calls[0][1]).toBe(positions);
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

it("links shaders without synchronous per-shader status queries", () => {
  const canvas = document.createElement("canvas");
  const gl = canvas.getContext("webgl2")!;
  const status = vi.spyOn(gl, "getShaderParameter");
  const gpu = createGpuPoints(canvas);
  try {
    expect(status).not.toHaveBeenCalled();
  } finally {
    status.mockRestore();
    gpu.dispose();
  }
});

it("restores real GPU resources and replays the newest frame after context loss", async () => {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 100;
  const gpu = createGpuPoints(canvas);
  const gl = canvas.getContext("webgl2")!;
  const extension = gl.getExtension("WEBGL_lose_context");
  expect(extension).not.toBeNull();
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
  let lost = false;
  let restoredPixel: number[] | undefined;
  canvas.addEventListener(
    "webglcontextlost",
    () => {
      lost = true;
    },
    { once: true },
  );
  canvas.addEventListener(
    "webglcontextrestored",
    () => {
      // Read in the restoration task before the default drawing buffer is cleared.
      const pixel = new Uint8Array(4);
      gl.readPixels(75, 24, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      restoredPixel = Array.from(pixel);
    },
    { once: true },
  );
  try {
    gpu.draw(
      {
        length: 1,
        buffers: () => ({ positions: new Float32Array([0.25, 0.25]) }),
      },
      view,
    );
    extension!.loseContext();
    await expect.poll(() => lost).toBe(true);
    gpu.draw(
      {
        length: 1,
        buffers: () => ({ positions: new Float32Array([0.75, 0.75]) }),
      },
      view,
    );
    extension!.restoreContext();
    await expect.poll(() => restoredPixel).toEqual([255, 0, 0, 255]);
    expect(canvas.dataset.gpuError).toBeUndefined();
    expect(gl.getError()).toBe(gl.NO_ERROR);
  } finally {
    gpu.dispose();
  }
});
