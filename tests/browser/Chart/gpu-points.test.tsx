import { afterEach, beforeEach, expect, it } from "vitest";

import {
  createGpuPoints,
  type GpuView,
} from "../../../components/Chart/rendering/gpu";
import { acquireWebGpuSurface } from "../../../components/Chart/rendering/webgpu-surface";
import {
  hasWebGpu,
  readGpuPixel,
  readGpuPixelsBottomUp,
} from "./webgpu-readback";

beforeEach(async ({ skip }) => {
  if (!(await hasWebGpu())) {
    skip();
  }
});
const disposers: (() => void)[] = [];
afterEach(() => disposers.splice(0).forEach((dispose) => dispose()));

async function fixture(ratio: number, _shared = false) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 80 * ratio;

  const gpu = createGpuPoints(canvas);
  disposers.push(() => {
    gpu.dispose();
  });
  await gpu.ready;
  const positions = new Float32Array([0.5, 0.5]);
  const data = { length: 1, buffers: () => ({ positions }) };
  const view: GpuView = {
    width: 80,
    height: 80,
    plotWidth: 60,
    plotHeight: 60,
    k: 1,
    x: 0,
    y: 0,
    matrix: new DOMMatrix().translate(10, 10),
    ratio,
    radius: 8,
    color: [1, 0, 0, 1],
  };
  const pixels = () => readGpuPixelsBottomUp(canvas);
  const pixel = (x: number, y: number) =>
    readGpuPixel(canvas, Math.floor(x * ratio), Math.floor(y * ratio));
  return { gpu, canvas, positions, data, view, pixels, pixel };
}

it.each([1, 2])(
  "preserves the default fill and zero-width stroke at DPR %s",
  async (ratio) => {
    const { gpu, data, view, pixels, pixel } = await fixture(ratio);
    gpu.draw(data, view);
    const filled = await pixels();
    expect(await pixel(40, 40)).toEqual([255, 0, 0, 255]);
    expect(await pixel(46, 40)).toEqual([255, 0, 0, 255]);
    expect(await pixel(49, 40)).toEqual([0, 0, 0, 0]);
    gpu.draw(data, { ...view, stroke: { color: [0, 0, 1, 1], width: 0 } });
    expect(await pixels()).toEqual(filled);
  },
);

it.each([1, 2])(
  "renders a centered stroke with solid fill and ring, antialiasing only boundaries at DPR %s",
  async (ratio) => {
    const { gpu, data, view, pixels, pixel, canvas } = await fixture(ratio);
    gpu.draw(data, { ...view, stroke: { color: [0, 0, 1, 1], width: 4 } });
    expect(await pixel(40, 40)).toEqual([255, 0, 0, 255]);
    expect(await pixel(44, 40)).toEqual([255, 0, 0, 255]);
    expect(await pixel(47, 40)).toEqual([0, 0, 255, 255]);
    expect(await pixel(48, 40)).toEqual([0, 0, 255, 255]);
    expect(await pixel(51, 40)).toEqual([0, 0, 0, 0]);
    const rgba = await pixels();
    let partial = 0;
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const offset = (y * canvas.width + x) * 4;
        const distance = Math.hypot(x + 0.5 - 40 * ratio, y + 0.5 - 40 * ratio);
        const pixel = Array.from(rgba.subarray(offset, offset + 4));
        if (distance < 6 * ratio - 0.5) {
          expect(pixel).toEqual([255, 0, 0, 255]);
        }
        if (distance > 6 * ratio + 0.5 && distance < 10 * ratio - 0.5) {
          expect(pixel).toEqual([0, 0, 255, 255]);
        }
        if (distance < 10 * ratio - 0.5) {
          expect(pixel[3]).toBe(255);
        }
        if (distance > 10 * ratio + 0.5) {
          expect(pixel).toEqual([0, 0, 0, 0]);
        }
        if (pixel[3] > 0 && pixel[3] < 255) {
          partial++;
        }
      }
    }
    expect(partial).toBeGreaterThan(0);
  },
);

it.each([1, 2])(
  "clips and patches points whose stroke alone intersects the plot at DPR %s",
  async (ratio) => {
    const { gpu, data, positions, view, pixel } = await fixture(ratio);
    const stroked = {
      ...view,
      radius: 2,
      stroke: { color: [0, 0, 1, 1], width: 12 },
    };
    positions.set([-0.1, 0.5]);
    gpu.draw(data, stroked);
    expect(await pixel(10, 40)).toEqual([0, 0, 255, 255]);
    expect(await pixel(9, 40)).toEqual([0, 0, 0, 0]);
    positions.set([-0.5, 0.5]);
    gpu.patch([0]);
    gpu.draw(data, stroked);
    expect(await pixel(10, 40)).toEqual([0, 0, 0, 0]);
    positions.set([-0.1, 0.5]);
    gpu.patch([0]);
    gpu.draw(data, stroked);
    expect(await pixel(10, 40)).toEqual([0, 0, 255, 255]);
  },
);

it.each([
  { color: [0, 0, 1, 1], width: -1 },
  { color: [0, 0, 1, 1], width: NaN },
  { color: [0, 0, 1, 1], width: Infinity },
  { color: [0, 0, 1, 1], width: 3e38 },
  { color: [0, 0, 1], width: 4 },
  { color: [0, 0, 1, 2], width: 4 },
  { color: [-1, 0, 1, 1], width: 4 },
  { color: [0, NaN, 1, 1], width: 4 },
])("rejects invalid stroke atomically: %j", async (stroke) => {
  const { gpu, data, view, pixels, positions, pixel } = await fixture(2);
  gpu.draw(data, view);
  const before = await pixels();
  positions.set([0.25, 0.5]);
  gpu.patch([0]);
  expect(() =>
    gpu.draw(
      { length: 0, buffers: () => ({ positions: new Float32Array() }) },
      { ...view, stroke },
    ),
  ).toThrow(RangeError);
  expect(await pixels()).toEqual(before);
  gpu.draw(data, view);
  expect(await pixel(25, 40)).toEqual([255, 0, 0, 255]);
  expect(await pixel(40, 40)).toEqual([0, 0, 0, 0]);
});

it("preserves other layers with clear false and restores point rendering state", async () => {
  const { gpu, canvas, data, view, pixel } = await fixture(1, true);
  gpu.draw(data, view);

  const other = createGpuPoints(canvas);
  other.draw(data, { ...view, x: 20, color: [0, 1, 0, 1], clear: false });
  expect(await pixel(40, 40)).toEqual([255, 0, 0, 255]);
  expect(await pixel(60, 40)).toEqual([0, 255, 0, 255]);
  other.dispose();
  expect(gpu.available).toBe(true);
  gpu.draw(data, view);
  expect(await pixel(40, 40)).toEqual([255, 0, 0, 255]);
  expect(await pixel(60, 40)).toEqual([0, 0, 0, 0]);
});

it.each([1, 2])(
  "renders and patches per-point radii with centered strokes at DPR %s",
  async (ratio) => {
    const { gpu, view, pixel } = await fixture(ratio);
    const positions = new Float32Array([0.25, 0.5, 0.75, 0.5]);
    const radii = new Float32Array([2, 8]);
    const data = { length: 2, buffers: () => ({ positions, radii }) };
    const stroked = {
      ...view,
      radius: 1,
      stroke: { color: [0, 0, 1, 1], width: 4 },
    };
    gpu.draw(data, stroked);
    expect(await pixel(27, 40)).toEqual([0, 0, 255, 255]);
    expect(await pixel(31, 40)).toEqual([0, 0, 0, 0]);
    expect(await pixel(59, 40)).toEqual([255, 0, 0, 255]);
    expect(await pixel(63, 40)).toEqual([0, 0, 255, 255]);
    radii[0] = 8;
    radii[1] = 2;
    gpu.patch([0, 1]);
    gpu.draw(data, stroked);
    expect(await pixel(29, 40)).toEqual([255, 0, 0, 255]);
    expect(await pixel(33, 40)).toEqual([0, 0, 255, 255]);
    expect(await pixel(61, 40)).toEqual([0, 0, 0, 0]);
    gpu.draw(
      { length: 2, buffers: () => ({ positions }) },
      { ...view, radius: 2 },
    );
    expect(await pixel(25, 40)).toEqual([255, 0, 0, 255]);
    expect(await pixel(29, 40)).toEqual([0, 0, 0, 0]);
  },
);

it.each([1, 2])(
  "patches changing radii whose previous or next footprint intersects the plot at DPR %s",
  async (ratio) => {
    const { gpu, view, pixel } = await fixture(ratio);
    const positions = new Float32Array([-0.1, 0.5]);
    const radii = new Float32Array([8]);
    const data = { length: 1, buffers: () => ({ positions, radii }) };
    const small = { ...view, radius: 1 };
    gpu.draw(data, small);
    expect(await pixel(10, 40)).toEqual([255, 0, 0, 255]);
    radii[0] = 1;
    gpu.patch([0]);
    gpu.draw(data, small);
    expect(await pixel(10, 40)).toEqual([0, 0, 0, 0]);
    radii[0] = 8;
    gpu.patch([0]);
    gpu.draw(data, small);
    expect(await pixel(10, 40)).toEqual([255, 0, 0, 255]);
  },
);

it.each(
  [[], [-1], [NaN], [Infinity], [3e38], [1, 2]].map((values) => ({ values })),
)("rejects invalid radii atomically: %j", async ({ values }) => {
  const { gpu, data, view, pixels } = await fixture(2);
  gpu.draw(data, view);
  const before = await pixels();
  const invalid = {
    length: 1,
    buffers: () => ({
      positions: new Float32Array([0.5, 0.5]),
      radii: new Float32Array(values),
    }),
  };
  expect(() => gpu.draw(invalid, view)).toThrow(RangeError);
  expect(await pixels()).toEqual(before);
});

it("releases only its resources while another renderer retains the surface", async () => {
  const { gpu, canvas } = await fixture(1);
  const other = createGpuPoints(canvas);
  await other.ready;
  gpu.dispose();
  expect(other.available).toBe(true);
  other.dispose();
});
it("draws to the main canvas after an offscreen draw", async () => {
  const { gpu, canvas, data, view, pixel } = await fixture(1);
  const surface = acquireWebGpuSurface(canvas);
  const target = surface.createTarget(80, 80);
  try {
    gpu.draw(data, { ...view, target });
    gpu.draw(data, view);
    expect(await pixel(40, 40)).toEqual([255, 0, 0, 255]);
  } finally {
    surface.destroyTarget(target);
    surface.release();
  }
});

it.each([1, 2])(
  "clips in CSS canvas coordinates and resets the clip on the next layer at DPR %s",
  async (ratio) => {
    const { gpu, data, view, pixel } = await fixture(ratio);
    gpu.draw(data, view);
    gpu.draw(data, {
      ...view,
      color: [0, 1, 0, 1],
      clear: false,
      clip: { x: 40, y: 30, width: 20, height: 10 },
    });
    expect(await pixel(44, 36)).toEqual([0, 255, 0, 255]);
    expect(await pixel(36, 36)).toEqual([255, 0, 0, 255]);
    expect(await pixel(44, 44)).toEqual([255, 0, 0, 255]);
    gpu.draw(data, { ...view, color: [0, 0, 1, 1] });
    expect(await pixel(36, 36)).toEqual([0, 0, 255, 255]);
    expect(await pixel(44, 44)).toEqual([0, 0, 255, 255]);
  },
);

it.each([1, 2])(
  "intersects clips extending beyond the framebuffer at DPR %s",
  async (ratio) => {
    const { gpu, data, view, pixel, pixels } = await fixture(ratio);
    gpu.draw(data, {
      ...view,
      clip: { x: -100, y: -100, width: 140, height: 140 },
    });
    expect(await pixel(36, 36)).toEqual([255, 0, 0, 255]);
    expect(await pixel(44, 36)).toEqual([0, 0, 0, 0]);
    expect(await pixel(36, 44)).toEqual([0, 0, 0, 0]);
    gpu.draw(data, {
      ...view,
      clip: { x: 40, y: 40, width: 100, height: 100 },
    });
    expect(await pixel(44, 44)).toEqual([255, 0, 0, 255]);
    expect(await pixel(36, 44)).toEqual([0, 0, 0, 0]);
    expect(await pixel(44, 36)).toEqual([0, 0, 0, 0]);
    await pixels();
  },
);

it.each(
  [1, 2].flatMap((ratio) =>
    [
      { x: 40, y: 40, width: 0, height: 20 },
      { x: 40, y: 40, width: 20, height: 0 },
      { x: -20, y: 0, width: 10, height: 80 },
      { x: 80, y: 0, width: 10, height: 80 },
      { x: 0, y: -20, width: 80, height: 10 },
      { x: 0, y: 80, width: 80, height: 10 },
      { x: Number.MAX_VALUE, y: 0, width: 0, height: 80 },
    ].map((clip) => ({ ratio, clip })),
  ),
)(
  "draws nothing for an empty clip intersection: %j",
  async ({ ratio, clip }) => {
    const { gpu, data, view, pixels } = await fixture(ratio);
    gpu.draw(data, { ...view, clip });
    expect((await pixels()).some((channel) => channel !== 0)).toBe(false);
  },
);

it.each([
  { x: NaN, y: 0, width: 80, height: 80 },
  { x: 0, y: Infinity, width: 80, height: 80 },
  { x: 0, y: 0, width: -1, height: 80 },
  { x: 0, y: 0, width: 80, height: -1 },
  { x: 0, y: 0, width: Infinity, height: 80 },
  { x: 0, y: 0, width: 80, height: NaN },
  { x: Number.MAX_VALUE, y: 0, width: Number.MAX_VALUE, height: 80 },
])(
  "rejects invalid clips before changing pixels or pending patches: %j",
  async (clip) => {
    const { gpu, data, view, positions, pixels, pixel } = await fixture(2);
    gpu.draw(data, view);
    const before = await pixels();
    positions.set([0.25, 0.5]);
    gpu.patch([0]);
    expect(() => gpu.draw(data, { ...view, clip })).toThrow(RangeError);
    expect(await pixels()).toEqual(before);
    gpu.draw(data, view);
    expect(await pixel(25, 40)).toEqual([255, 0, 0, 255]);
    expect(await pixel(40, 40)).toEqual([0, 0, 0, 0]);
  },
);

it.each([1, 2])(
  "dims points and strokes with sparse emphasis updates at DPR %s",
  async (ratio) => {
    const { gpu, view, pixel } = await fixture(ratio);
    const positions = new Float32Array([0.25, 0.5, 0.75, 0.5]);
    const radii = new Float32Array([8, 8]);
    const data = {
      immutable: true as const,
      length: 2,
      buffers: () => ({ positions, radii }),
    };
    const stroked = { ...view, stroke: { color: [0, 0, 1, 1], width: 4 } };
    gpu.draw(data, stroked);

    const dimmed = (rgba: number[], channel: number) => {
      expect(rgba[3]).toBeGreaterThanOrEqual(63);
      expect(rgba[3]).toBeLessThanOrEqual(65);
      expect(rgba[channel]).toBe(rgba[3]);
    };

    gpu.draw(data, {
      ...stroked,
      emphasis: { indices: [0, 0], opacity: 0.25 },
    });
    expect(await pixel(25, 40)).toEqual([255, 0, 0, 255]);
    dimmed(await pixel(55, 40), 0);
    dimmed(await pixel(63, 40), 2);

    gpu.draw(data, { ...stroked, emphasis: { indices: [1], opacity: 0.25 } });
    dimmed(await pixel(25, 40), 0);
    expect(await pixel(55, 40)).toEqual([255, 0, 0, 255]);
    expect(await pixel(63, 40)).toEqual([0, 0, 255, 255]);

    gpu.draw(data, {
      ...stroked,
      emphasis: { indices: [1, 1], opacity: 0.5 },
    });
    expect((await pixel(25, 40))[3]).toBeGreaterThanOrEqual(127);
    expect((await pixel(25, 40))[3]).toBeLessThanOrEqual(129);
    gpu.draw(data, stroked);
    expect(await pixel(25, 40)).toEqual([255, 0, 0, 255]);
    expect(await pixel(55, 40)).toEqual([255, 0, 0, 255]);

    gpu.draw(data, { ...stroked, emphasis: { indices: [], opacity: 0 } });
    expect(await pixel(25, 40)).toEqual([0, 0, 0, 0]);
    expect(await pixel(55, 40)).toEqual([0, 0, 0, 0]);
  },
);

it("resets emphasis flags when replacing the source", async () => {
  const { gpu, view, pixel } = await fixture(1);
  const positions = new Float32Array([0.25, 0.5, 0.75, 0.5]);
  const data = { length: 2, buffers: () => ({ positions }) };
  gpu.draw(data, { ...view, emphasis: { indices: [0], opacity: 0 } });
  expect(await pixel(25, 40)).toEqual([255, 0, 0, 255]);
  gpu.draw({ ...data }, { ...view, emphasis: { indices: [1], opacity: 0 } });
  expect(await pixel(25, 40)).toEqual([0, 0, 0, 0]);
  expect(await pixel(55, 40)).toEqual([255, 0, 0, 255]);
});

it.each([
  { indices: [-1], opacity: 0.5 },
  { indices: [1], opacity: 0.5 },
  { indices: [0.5], opacity: 0.5 },
  { indices: [NaN], opacity: 0.5 },
  { indices: [Infinity], opacity: 0.5 },
  { indices: [0], opacity: -1 },
  { indices: [0], opacity: 2 },
  { indices: [0], opacity: NaN },
  { indices: [0], opacity: Infinity },
])(
  "rejects invalid emphasis without changing pixels or uploads: %j",
  async (emphasis) => {
    const { gpu, data, view, pixels } = await fixture(1);
    gpu.draw(data, view);
    const before = await pixels();

    expect(() => gpu.draw(data, { ...view, emphasis })).toThrow(RangeError);
    expect(await pixels()).toEqual(before);
  },
);

it("applies composed opacity overrides after selected indices and removes stale overrides", async () => {
  const { gpu, view, pixel } = await fixture(1);
  const positions = new Float32Array([0.25, 0.5, 0.5, 0.5, 0.75, 0.5]);
  const data = { length: 3, buffers: () => ({ positions }) };
  gpu.draw(data, {
    ...view,
    radius: 3,
    emphasis: {
      indices: [0, 1],
      opacity: 0.25,
      overrides: [
        { index: 0, opacity: 0 },
        { index: 1, opacity: 0.6 },
      ],
    },
  });
  expect(await pixel(25, 40)).toEqual([0, 0, 0, 0]);
  expect((await pixel(40, 40))[3]).toBeGreaterThanOrEqual(152);
  expect((await pixel(40, 40))[3]).toBeLessThanOrEqual(154);
  expect((await pixel(40, 40))[0]).toBe((await pixel(40, 40))[3]);
  expect((await pixel(55, 40))[3]).toBeGreaterThanOrEqual(63);
  expect((await pixel(55, 40))[3]).toBeLessThanOrEqual(65);
  gpu.draw(data, {
    ...view,
    radius: 3,
    emphasis: { indices: [0], opacity: 0.25 },
  });
  expect(await pixel(25, 40)).toEqual([255, 0, 0, 255]);
  expect((await pixel(40, 40))[3]).toBeGreaterThanOrEqual(63);
  expect((await pixel(40, 40))[3]).toBeLessThanOrEqual(65);
});

it.each([
  { index: -1, opacity: 0.6 },
  { index: 1, opacity: 0.6 },
  { index: 0.5, opacity: 0.6 },
  { index: 0, opacity: -1 },
  { index: 0, opacity: 2 },
  { index: 0, opacity: NaN },
  { index: 0, opacity: Infinity },
])("rejects invalid opacity overrides atomically: %j", async (override) => {
  const { gpu, data, view, pixels } = await fixture(1);
  gpu.draw(data, view);
  const before = await pixels();

  expect(() =>
    gpu.draw(data, {
      ...view,
      emphasis: {
        indices: [0],
        opacity: 0.25,
        overrides: [override],
      },
    }),
  ).toThrow(RangeError);
  expect(await pixels()).toEqual(before);
});
