import { expect, it } from "vitest";

import {
  createGpuPoints,
  type GpuView,
} from "../../../components/Chart/rendering/gpu";
import { acquireWebGpuSurface } from "../../../components/Chart/rendering/webgpu-surface";
import { hasWebGpu, readGpuPixel } from "./webgpu-readback";

it("renders WebGPU point quads, stroke, affine ellipse, opacity and convex clipping", async ({
  skip,
}) => {
  if (!(await hasWebGpu())) {
    return skip();
  }
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 100;
  const renderer = createGpuPoints(canvas);
  await renderer.ready;
  const data = {
    length: 1,
    buffers: () => ({ positions: new Float32Array([0.5, 0.5]) }),
  };
  const view: GpuView = {
    width: 100,
    height: 100,
    plotWidth: 100,
    plotHeight: 100,
    x: 0,
    y: 0,
    k: 1,
    ratio: 1,
    radius: 10,
    color: [1, 0, 0, 1],
    matrix: new DOMMatrix(),
  };
  try {
    expect(renderer.available, renderer.error).toBe(true);
    renderer.draw(data, { ...view, stroke: { color: [0, 0, 1, 1], width: 4 } });
    expect(await readGpuPixel(canvas, 50, 50)).toEqual([255, 0, 0, 255]);
    expect(await readGpuPixel(canvas, 60, 50)).toEqual([0, 0, 255, 255]);
    renderer.draw(data, {
      ...view,
      pointTransform: [2, 0, 0, 1],
      opacity: 0.5,
    });
    expect((await readGpuPixel(canvas, 65, 50))[3]).toBeCloseTo(128, 0);
    expect(await readGpuPixel(canvas, 50, 65)).toEqual([0, 0, 0, 0]);
    renderer.draw(data, {
      ...view,
      clipPolygon: [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 50, y: 100 },
        { x: 0, y: 100 },
      ],
    });
    expect(await readGpuPixel(canvas, 53, 50)).toEqual([0, 0, 0, 0]);
    renderer.draw(
      { length: 0, buffers: () => ({ positions: new Float32Array(0) }) },
      view,
    );
    expect(await readGpuPixel(canvas, 50, 50)).toEqual([0, 0, 0, 0]);
    expect(renderer.error).toBeUndefined();
  } finally {
    renderer.dispose();
  }
});

it("resizes a standalone point surface with its canvas", async ({ skip }) => {
  if (!(await hasWebGpu())) {
    return skip();
  }
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 100;
  const renderer = createGpuPoints(canvas);
  await renderer.ready;
  const data = {
    length: 1,
    buffers: () => ({ positions: new Float32Array([0.5, 0.5]) }),
  };
  const view: GpuView = {
    width: 100,
    height: 100,
    plotWidth: 100,
    plotHeight: 100,
    x: 0,
    y: 0,
    k: 1,
    ratio: 1,
    radius: 10,
    color: [1, 0, 0, 1],
    matrix: new DOMMatrix(),
  };
  try {
    renderer.draw(data, view);
    expect(await readGpuPixel(canvas, 50, 50)).toEqual([255, 0, 0, 255]);
    canvas.width = canvas.height = 200;
    renderer.draw(data, {
      ...view,
      width: 200,
      height: 200,
      plotWidth: 200,
      plotHeight: 200,
    });
    expect(await readGpuPixel(canvas, 100, 100)).toEqual([255, 0, 0, 255]);
  } finally {
    renderer.dispose();
  }
});

it("retains point geometry for earlier draws in a shared frame", async ({
  skip,
}) => {
  if (!(await hasWebGpu())) {
    return skip();
  }
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 100;
  const surface = acquireWebGpuSurface(canvas);
  const gpu = createGpuPoints(canvas);
  await gpu.ready;
  const positions = new Float32Array([0.25, 0.5]);
  const data = { length: 1, buffers: () => ({ positions }) };
  const view = {
    width: 100,
    height: 100,
    plotWidth: 100,
    plotHeight: 100,
    ratio: 1,
    k: 1,
    x: 0,
    y: 0,
    matrix: new DOMMatrix(),
    radius: 8,
    color: [1, 0, 0, 1],
  };
  try {
    surface.beginFrame(100, 100);
    gpu.draw(data, view);
    positions[0] = 0.75;
    gpu.patch([0]);
    gpu.draw(data, { ...view, color: [0, 1, 0, 1], clear: false });
    surface.endFrame();
    expect(await readGpuPixel(canvas, 25, 50)).toEqual([255, 0, 0, 255]);
    expect(await readGpuPixel(canvas, 75, 50)).toEqual([0, 255, 0, 255]);
  } finally {
    gpu.dispose();
    surface.release();
  }
});

it("retains per-draw emphasis values inside a shared frame", async ({
  skip,
}) => {
  if (!(await hasWebGpu())) {
    return skip();
  }
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 100;
  const surface = acquireWebGpuSurface(canvas),
    renderer = createGpuPoints(canvas);
  await renderer.ready;
  const data = {
    length: 2,
    buffers: () => ({ positions: new Float32Array([0.25, 0.5, 0.75, 0.5]) }),
  };
  const view = {
    width: 100,
    height: 100,
    plotWidth: 100,
    plotHeight: 100,
    ratio: 1,
    k: 1,
    x: 0,
    y: 0,
    matrix: new DOMMatrix(),
    radius: 8,
    color: [1, 0, 0, 1],
  };
  try {
    surface.beginFrame(100, 100);
    renderer.draw(data, { ...view, emphasis: { indices: [0], opacity: 0 } });
    renderer.draw(data, {
      ...view,
      color: [0, 1, 0, 1],
      clear: false,
      emphasis: { indices: [1], opacity: 0 },
    });
    surface.endFrame();
    expect(await readGpuPixel(canvas, 25, 50)).toEqual([255, 0, 0, 255]);
    expect(await readGpuPixel(canvas, 75, 50)).toEqual([0, 255, 0, 255]);
  } finally {
    renderer.dispose();
    surface.release();
  }
});

it("redraws the same point source after aborting a staged position patch", async ({
  skip,
}) => {
  if (!(await hasWebGpu())) {
    return skip();
  }
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 100;
  const surface = acquireWebGpuSurface(canvas);
  const gpu = createGpuPoints(canvas);
  await gpu.ready;
  const positions = new Float32Array([0.25, 0.5]);
  const data = { length: 1, buffers: () => ({ positions }) };
  const view = {
    width: 100,
    height: 100,
    plotWidth: 100,
    plotHeight: 100,
    ratio: 1,
    k: 1,
    x: 0,
    y: 0,
    matrix: new DOMMatrix(),
    radius: 8,
    color: [1, 0, 0, 1],
  };
  try {
    gpu.draw(data, view);
    surface.beginFrame(100, 100);
    positions[0] = 0.5;
    gpu.patch([0]);
    gpu.draw(data, view);
    surface.abortFrame();
    gpu.draw(data, view);
    expect(await readGpuPixel(canvas, 50, 50)).toEqual([255, 0, 0, 255]);
  } finally {
    gpu.dispose();
    surface.release();
  }
});

it("rebuilds emphasis state after aborting staged flag updates", async ({
  skip,
}) => {
  if (!(await hasWebGpu())) {
    return skip();
  }
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 100;
  const surface = acquireWebGpuSurface(canvas),
    gpu = createGpuPoints(canvas);
  await gpu.ready;
  const positions = new Float32Array([0.25, 0.5, 0.75, 0.5]);
  const data = { length: 2, buffers: () => ({ positions }) };
  const view = {
    width: 100,
    height: 100,
    plotWidth: 100,
    plotHeight: 100,
    ratio: 1,
    k: 1,
    x: 0,
    y: 0,
    matrix: new DOMMatrix(),
    radius: 8,
    color: [1, 0, 0, 1],
    emphasis: { indices: [0], opacity: 0 },
  };
  try {
    gpu.draw(data, view);
    const updated = { ...view, emphasis: { indices: [1], opacity: 0 } };
    surface.beginFrame(100, 100);
    gpu.draw(data, updated);
    surface.abortFrame();
    gpu.draw(data, updated);
    expect(await readGpuPixel(canvas, 25, 50)).toEqual([0, 0, 0, 0]);
    expect(await readGpuPixel(canvas, 75, 50)).toEqual([255, 0, 0, 255]);
  } finally {
    gpu.dispose();
    surface.release();
  }
});
