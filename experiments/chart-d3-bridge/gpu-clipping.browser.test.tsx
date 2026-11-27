import { beforeEach, expect, it, vi } from "vitest";

import {
  createGpuPoints,
  type GpuView,
} from "../../components/Chart/rendering/gpu";
import { acquireWebGpuSurface } from "../../components/Chart/rendering/webgpu-surface";
import {
  hasWebGpu,
  readGpuPixelsBottomUp,
} from "../../tests/browser/Chart/webgpu-readback";
import { createDensity } from "./density";
import { trackPointUploads } from "./gpu-test-uploads";

async function fixture(
  ratio: number,
  matrix = new DOMMatrix().translate(20, 20),
) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 180 * ratio;
  const gpu = createGpuPoints(canvas);
  await gpu.ready;
  const surface = acquireWebGpuSurface(canvas);
  const queue = surface.device.queue;
  surface.release();
  const view: GpuView = {
    width: 180,
    height: 180,
    plotWidth: 100,
    plotHeight: 100,
    k: 1,
    x: 0,
    y: 0,
    matrix,
    ratio,
    radius: 7,
    color: [1, 0, 0, 1],
  };
  async function coverage() {
    const rgba = await readGpuPixelsBottomUp(canvas);
    const inverse = matrix.inverse();
    let inside = 0,
      outside = 0;
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const alpha = rgba[(y * canvas.width + x) * 4 + 3];
        const local = new DOMPoint(
          (x + 0.5) / ratio,
          (canvas.height - y - 0.5) / ratio,
        ).matrixTransform(inverse);
        if (
          local.x < -0.01 ||
          local.x > 100.01 ||
          local.y < -0.01 ||
          local.y > 100.01
        ) {
          outside += alpha;
        } else {
          inside += alpha;
        }
      }
    }
    return { inside, outside };
  }
  return { gpu, queue, view, coverage };
}
const source = (positions: Float32Array) => ({
  length: positions.length / 2,
  buffers: () => ({ positions }),
});

it.each(
  [1, 2].flatMap((ratio) =>
    [false, true].flatMap((transformed) =>
      [false, true].map((density) => ({ ratio, transformed, density })),
    ),
  ),
)("clips every plot edge: %j", async ({ ratio, transformed, density }) => {
  const matrix = transformed
    ? new DOMMatrix().translate(65, 20).rotate(25).scale(0.8, 1.1).skewX(12)
    : new DOMMatrix().translate(20, 20);
  const { gpu, view, coverage } = await fixture(ratio, matrix);
  try {
    const positions = new Float32Array([0, 0.5, 1, 0.5, 0.5, 0, 0.5, 1]);
    gpu.draw(source(positions), {
      ...view,
      density: density
        ? { positions, counts: new Float32Array([1, 1, 1, 1]), cells: 8 }
        : undefined,
    });
    expect((await coverage()).inside).toBeGreaterThan(0);
    expect((await coverage()).outside).toBe(0);
  } finally {
    gpu.dispose();
  }
});

it.each([1, 2])(
  "keeps a viewport-intersecting density bin with an outside center at DPR %s",
  async (ratio) => {
    const { gpu, view, coverage } = await fixture(ratio);
    try {
      const positions = new Float32Array([0.5075, 0.55]);
      const data = source(positions);
      const zoom = { ...view, k: 8, x: -405.6, y: -400 };
      gpu.draw(data, zoom);
      expect((await coverage()).inside).toBeGreaterThan(0);
      const pyramid = createDensity(new Float64Array([0.5075, 0.55]));
      const bounds = { x: 0.507, y: 0.5, width: 0.125, height: 0.125 };
      const density = pyramid.view(bounds, 13);
      gpu.draw(data, { ...zoom, density });
      expect((await coverage()).inside).toBeGreaterThan(0);
      expect((await coverage()).outside).toBe(0);
      pyramid.patch(0, 0.9, 0.9);
      gpu.draw(data, { ...zoom, density: pyramid.view(bounds, 13) });
      expect(await coverage()).toEqual({ inside: 0, outside: 0 });
      gpu.draw(source(new Float32Array([0.9, 0.9])), zoom);
      expect(await coverage()).toEqual({ inside: 0, outside: 0 });
    } finally {
      gpu.dispose();
    }
  },
);

it.each([1, 2])(
  "flushes GPU-visible dirty footprints despite CPU rounding at DPR %s",
  async (ratio) => {
    const { gpu, view, coverage } = await fixture(ratio);
    try {
      const positions = new Float32Array([0.6, 0.5, 5, 5]);
      const data = source(positions);
      const zoom = { ...view, x: -60.0000025 };
      gpu.draw(data, zoom);
      expect((await coverage()).inside).toBeGreaterThan(0);
      const uploads = trackPointUploads();
      positions.set([-1, 0.5, 6, 6]);
      gpu.patch([0, 1]);
      for (let i = 0; i < 3; i++) {
        gpu.draw(data, zoom);
        expect(await coverage()).toEqual({ inside: 0, outside: 0 });
      }
      expect(uploads.calls).toHaveLength(1);
      expect(uploads.calls[0].values.byteLength).toBe(8);
      positions[0] = 0.58;
      gpu.patch([0]);
      gpu.draw(data, zoom);
      expect((await coverage()).inside).toBeGreaterThan(0);
      expect((await coverage()).outside).toBe(0);
    } finally {
      gpu.dispose();
      vi.restoreAllMocks();
    }
  },
);

beforeEach(async ({ skip }) => {
  if (!(await hasWebGpu())) {
    skip();
  }
});
