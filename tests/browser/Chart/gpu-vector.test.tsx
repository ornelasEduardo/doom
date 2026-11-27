import { afterEach, expect, it } from "vitest";

import { createGpuPoints } from "../../../components/Chart/rendering/gpu";
import { createGpuCompositor } from "../../../components/Chart/rendering/gpu-compositor";
import {
  createGpuVector,
  type VectorShape,
} from "../../../components/Chart/rendering/gpu-vector";
import { acquireWebGpuSurface } from "../../../components/Chart/rendering/webgpu-surface";
import { hasWebGpu, readGpuPixel, readGpuPixels } from "./webgpu-readback";

const gpuIt = it.skipIf(!(await hasWebGpu()));

const cleanup: (() => void)[] = [];
afterEach(() => cleanup.splice(0).forEach((fn) => fn()));
const points = (pairs: number[][], closed = false) => ({
  points: pairs.map(([x, y]) => ({ x, y })),
  closed,
});
const red = { color: [1, 0, 0, 1] };
async function fixture(ratio = 1) {
  const canvas = document.createElement("canvas");
  const gpu = createGpuVector(canvas);
  cleanup.push(() => gpu.dispose());
  await gpu.ready;
  const surface = acquireWebGpuSurface(canvas);
  cleanup.push(() => surface.release());
  const view = { width: 100, height: 100, ratio };
  const pixel = (x: number, y: number) =>
    readGpuPixel(canvas, Math.floor(x * ratio), Math.floor(y * ratio));
  return { gpu, surface, canvas, view, pixel };
}
gpuIt.each([1, 2])(
  "fills concavity, opposite winding holes and same winding overlap at DPR %s",
  async (ratio) => {
    const { gpu, view, pixel } = await fixture(ratio);
    gpu.draw(
      [
        {
          contours: [
            points([
              [10, 10],
              [90, 10],
              [90, 35],
              [35, 35],
              [35, 90],
              [10, 90],
            ]),
          ],
          fill: red,
        },
      ],
      view,
    );
    expect(await pixel(20, 70)).toEqual([255, 0, 0, 255]);
    expect(await pixel(70, 20)).toEqual([255, 0, 0, 255]);
    expect(await pixel(70, 70)).toEqual([0, 0, 0, 0]);
    const outer = points([
      [10, 10],
      [90, 10],
      [90, 90],
      [10, 90],
    ]);
    const inner = points([
      [30, 30],
      [30, 70],
      [70, 70],
      [70, 30],
    ]);
    gpu.draw([{ contours: [outer, inner], fill: red }], view);
    expect(await pixel(50, 50)).toEqual([0, 0, 0, 0]);
    expect(await pixel(20, 50)).toEqual([255, 0, 0, 255]);
    gpu.draw(
      [
        {
          contours: [
            outer,
            { ...inner, points: inner.points.slice().reverse() },
          ],
          fill: red,
        },
      ],
      view,
    );
    expect(await pixel(50, 50)).toEqual([255, 0, 0, 255]);
    gpu.draw(
      [
        {
          contours: [
            points([
              [10, 10],
              [90, 90],
              [10, 90],
              [90, 10],
            ]),
          ],
          fill: red,
        },
      ],
      view,
    );
    expect(await pixel(50, 20)).toEqual([255, 0, 0, 255]);
    expect(await pixel(50, 80)).toEqual([255, 0, 0, 255]);
    expect(await pixel(15, 50)).toEqual([0, 0, 0, 0]);
  },
);
gpuIt.each([1, 2])(
  "unions round stroke joins/caps without alpha accumulation or gap bridges at DPR %s",
  async (ratio) => {
    const { gpu, view, pixel } = await fixture(ratio);
    gpu.draw(
      [
        {
          contours: [
            points([
              [20, 30],
              [50, 30],
              [50, 60],
            ]),
            points([
              [75, 30],
              [90, 30],
            ]),
          ],
          stroke: { color: [1, 0, 0, 0.5], width: 10 },
        },
      ],
      view,
    );
    for (const [x, y] of [
      [20, 30],
      [17, 30],
      [48, 32],
      [50, 58],
      [50, 63],
    ]) {
      expect(await pixel(x, y)).toEqual([128, 0, 0, 128]);
    }
    expect(await pixel(63, 30)).toEqual([0, 0, 0, 0]);
    expect(await pixel(15, 25)).toEqual([0, 0, 0, 0]);
    gpu.draw(
      [
        {
          contours: [
            points(
              [
                [20, 20],
                [80, 20],
                [80, 80],
              ],
              true,
            ),
          ],
          stroke: { ...red, width: 6 },
        },
      ],
      view,
    );
    expect(await pixel(50, 50)).toEqual([255, 0, 0, 255]);
  },
);
gpuIt(
  "clips negative coordinates, interpolates gradient alpha, and clears old frames",
  async () => {
    const { gpu, view, pixel } = await fixture(2);
    gpu.draw(
      [
        {
          contours: [
            points([
              [-30, -30],
              [130, -30],
              [130, 130],
              [-30, 130],
            ]),
          ],
          fill: {
            ...red,
            gradient: { y0: 0, y1: 100, startOpacity: 1, endOpacity: 0 },
          },
          opacity: 0.5,
        },
      ],
      { ...view, clip: { x: 10, y: 10, width: 80, height: 80 } },
    );
    expect(await pixel(9, 50)).toEqual([0, 0, 0, 0]);
    expect(await pixel(90, 50)).toEqual([0, 0, 0, 0]);
    expect((await pixel(50, 20))[3]).toBeGreaterThan(98);
    expect((await pixel(50, 20))[3]).toBeLessThan(104);
    expect((await pixel(50, 80))[3]).toBeLessThan(27);
    expect((await pixel(50, 20))[0]).toBe((await pixel(50, 20))[3]);
    gpu.draw([], view);
    expect(await pixel(50, 20)).toEqual([0, 0, 0, 0]);
  },
);
gpuIt(
  "replays the newest frame after real context loss without affecting another instance",
  async () => {
    const a = await fixture();
    const b = await fixture();
    const shape: VectorShape = {
      contours: [
        points([
          [10, 10],
          [90, 10],
          [90, 90],
          [10, 90],
        ]),
      ],
      fill: red,
    };
    a.gpu.draw([shape], a.view);
    b.gpu.draw([shape], b.view);
    const old = a.surface.device;
    old.destroy();
    await old.lost;
    await Promise.resolve();
    expect(a.gpu.available).toBe(false);
    a.gpu.draw([{ ...shape, fill: { color: [0, 1, 0, 1] } }], a.view);
    b.gpu.draw([shape], b.view);
    expect(await b.pixel(50, 50)).toEqual([255, 0, 0, 255]);
    a.gpu.recover();
    await a.gpu.ready;
    expect(a.gpu.available).toBe(true);
    expect(await a.pixel(50, 50)).toEqual([0, 255, 0, 255]);
  },
);

gpuIt(
  "composites multiple renderers on one context with isolated pipeline state",
  async () => {
    const { gpu, canvas, view, pixel } = await fixture();
    const second = createGpuVector(canvas);
    cleanup.push(() => second.dispose());
    const square = points([
      [10, 10],
      [60, 10],
      [60, 60],
      [10, 60],
    ]);
    gpu.draw([{ contours: [square], fill: red }], view);
    await second.ready;
    second.draw(
      [
        {
          contours: [
            points([
              [40, 40],
              [90, 40],
              [90, 90],
              [40, 90],
            ]),
          ],
          fill: { color: [0, 1, 0, 0.5] },
        },
      ],
      { ...view, clear: false },
    );
    expect(await pixel(20, 20)).toEqual([255, 0, 0, 255]);
    const blended = await pixel(50, 50);
    expect(blended[0]).toBeGreaterThanOrEqual(127);
    expect(blended[0]).toBeLessThanOrEqual(128);
    expect(blended.slice(1)).toEqual([128, 0, 255]);
    expect(await pixel(80, 80)).toEqual([0, 128, 0, 128]);
    second.dispose();
    gpu.draw([{ contours: [square], fill: red }], view);
    expect(await pixel(20, 20)).toEqual([255, 0, 0, 255]);
    expect(await pixel(80, 80)).toEqual([0, 0, 0, 0]);
  },
);
gpuIt(
  "uses multisample coverage for diagonal fill and round stroke edges",
  async () => {
    const { gpu, canvas, view } = await fixture();
    gpu.draw(
      [
        {
          contours: [
            points([
              [10, 10],
              [80, 23],
              [44, 90],
            ]),
          ],
          fill: red,
        },
        {
          contours: [
            points([
              [20, 80],
              [80, 80],
            ]),
          ],
          stroke: { color: [0, 1, 0, 1], width: 7 },
        },
      ],
      view,
    );
    const pixels = await readGpuPixels(canvas);
    let partial = 0;
    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] > 0 && pixels[i] < 255) {
        partial++;
      }
    }
    expect(partial).toBeGreaterThan(20);
  },
);

gpuIt(
  "interleaves vector, point, and vector geometry in series order on one canvas",
  async () => {
    const { gpu, canvas, view, pixel } = await fixture();
    const dots = createGpuPoints(canvas);
    cleanup.push(() => dots.dispose());
    await dots.ready;
    gpu.draw(
      [
        {
          contours: [
            points([
              [10, 10],
              [90, 10],
              [90, 90],
              [10, 90],
            ]),
          ],
          fill: red,
        },
      ],
      view,
    );
    dots.draw(
      {
        length: 1,
        buffers: () => ({ positions: new Float32Array([0.5, 0.5]) }),
      },
      {
        ...view,
        plotWidth: 100,
        plotHeight: 100,
        k: 1,
        x: 0,
        y: 0,
        matrix: new DOMMatrix(),
        radius: 15,
        color: [0, 1, 0, 1],
        clear: false,
      },
    );
    expect(await pixel(50, 50)).toEqual([0, 255, 0, 255]);
    expect(await pixel(20, 20)).toEqual([255, 0, 0, 255]);
    gpu.draw(
      [
        {
          contours: [
            points([
              [45, 45],
              [55, 45],
              [55, 55],
              [45, 55],
            ]),
          ],
          fill: { color: [0, 0, 1, 1] },
        },
      ],
      { ...view, clear: false },
    );
    expect(await pixel(50, 50)).toEqual([0, 0, 255, 255]);
    expect(await pixel(60, 50)).toEqual([0, 255, 0, 255]);
    expect(await pixel(20, 20)).toEqual([255, 0, 0, 255]);
  },
);

gpuIt(
  "isolates overlapping opacity layers and retains four-sample edges",
  async () => {
    const { gpu, surface, canvas, view, pixel } = await fixture();
    const compositor = createGpuCompositor(surface);
    cleanup.push(() => compositor.dispose());
    surface.beginFrame(100, 100);
    compositor.begin(100, 100);
    gpu.draw([], view);
    const outer = compositor.open(0);
    gpu.draw(
      [
        {
          contours: [
            points([
              [10, 10],
              [80, 23],
              [44, 90],
            ]),
          ],
          fill: red,
        },
      ],
      { ...view, target: outer, clear: false },
    );
    const inner = compositor.open(1);
    gpu.draw(
      [
        {
          contours: [
            points([
              [30, 30],
              [70, 30],
              [70, 70],
              [30, 70],
            ]),
          ],
          fill: { color: [0, 1, 0, 1] },
        },
      ],
      { ...view, target: inner, clear: false },
    );
    compositor.close(1, 0.5, outer);
    compositor.close(0, 0.5, null);
    compositor.end();
    surface.endFrame();
    const p = await pixel(50, 50);
    expect(p[0]).toBeGreaterThanOrEqual(63);
    expect(p[0]).toBeLessThanOrEqual(64);
    expect(p[1]).toBeGreaterThanOrEqual(63);
    expect(p[1]).toBeLessThanOrEqual(64);
    expect(p[3]).toBe(128);
    const pixels = await readGpuPixels(canvas);
    expect(
      pixels.filter((v, i) => i % 4 === 3 && v > 0 && v < 120).length,
    ).toBeGreaterThan(20);
  },
);

gpuIt(
  "clears each painted mask before the next shape in a shared pass",
  async () => {
    const { gpu, view, pixel } = await fixture();
    gpu.draw(
      [
        {
          contours: [
            points([
              [10, 10],
              [90, 10],
              [10, 90],
            ]),
          ],
          fill: { color: [1, 0, 0, 0.5] },
        },
        {
          contours: [
            points([
              [90, 90],
              [90, 10],
              [10, 90],
            ]),
          ],
          fill: { color: [0, 0, 1, 0.5] },
        },
        // A transparent cover must still reset its stencil before the next mask.
        {
          contours: [
            points([
              [15, 15],
              [85, 15],
              [15, 85],
            ]),
          ],
          fill: { color: [0, 1, 0, 0] },
        },
        {
          contours: [
            points([
              [80, 80],
              [80, 20],
              [20, 80],
            ]),
          ],
          stroke: { color: [0, 1, 0, 0.5], width: 3 },
        },
      ],
      view,
    );
    expect(await pixel(30, 30)).toEqual([128, 0, 0, 128]);
    expect(await pixel(65, 65)).toEqual([0, 0, 128, 128]);
  },
);
