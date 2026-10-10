import { afterEach, expect, it } from "vitest";

import { createGpuPoints } from "../../../components/Chart/rendering/gpu";
import {
  createGpuVector,
  type VectorShape,
} from "../../../components/Chart/rendering/gpu-vector";

const cleanup: (() => void)[] = [];
afterEach(() => cleanup.splice(0).forEach((fn) => fn()));
const points = (pairs: number[][], closed = false) => ({
  points: pairs.map(([x, y]) => ({ x, y })),
  closed,
});
const red = { color: [1, 0, 0, 1] };
function fixture(ratio = 1) {
  const canvas = document.createElement("canvas");
  const gpu = createGpuVector(canvas);
  cleanup.push(() => gpu.dispose());
  const gl = canvas.getContext("webgl2")!;
  const view = { width: 100, height: 100, ratio };
  const pixel = (x: number, y: number) => {
    const out = new Uint8Array(4);
    gl.readPixels(
      Math.floor(x * ratio),
      canvas.height - 1 - Math.floor(y * ratio),
      1,
      1,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      out,
    );
    expect(gl.getError()).toBe(gl.NO_ERROR);
    return Array.from(out);
  };
  return { gpu, gl, canvas, view, pixel };
}
it.each([1, 2])(
  "fills concavity, opposite winding holes and same winding overlap at DPR %s",
  (ratio) => {
    const { gpu, view, pixel } = fixture(ratio);
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
    expect(pixel(20, 70)).toEqual([255, 0, 0, 255]);
    expect(pixel(70, 20)).toEqual([255, 0, 0, 255]);
    expect(pixel(70, 70)).toEqual([0, 0, 0, 0]);
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
    expect(pixel(50, 50)).toEqual([0, 0, 0, 0]);
    expect(pixel(20, 50)).toEqual([255, 0, 0, 255]);
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
    expect(pixel(50, 50)).toEqual([255, 0, 0, 255]);
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
    expect(pixel(50, 20)).toEqual([255, 0, 0, 255]);
    expect(pixel(50, 80)).toEqual([255, 0, 0, 255]);
    expect(pixel(15, 50)).toEqual([0, 0, 0, 0]);
  },
);
it.each([1, 2])(
  "unions round stroke joins/caps without alpha accumulation or gap bridges at DPR %s",
  (ratio) => {
    const { gpu, view, pixel } = fixture(ratio);
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
      expect(pixel(x, y)).toEqual([128, 0, 0, 128]);
    }
    expect(pixel(63, 30)).toEqual([0, 0, 0, 0]);
    expect(pixel(15, 25)).toEqual([0, 0, 0, 0]);
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
    expect(pixel(50, 50)).toEqual([255, 0, 0, 255]);
  },
);
it("clips negative coordinates, interpolates gradient alpha, and clears old frames", () => {
  const { gpu, view, pixel } = fixture(2);
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
  expect(pixel(9, 50)).toEqual([0, 0, 0, 0]);
  expect(pixel(90, 50)).toEqual([0, 0, 0, 0]);
  expect(pixel(50, 20)[3]).toBeGreaterThan(98);
  expect(pixel(50, 20)[3]).toBeLessThan(104);
  expect(pixel(50, 80)[3]).toBeLessThan(27);
  expect(pixel(50, 20)[0]).toBe(pixel(50, 20)[3]);
  gpu.draw([], view);
  expect(pixel(50, 20)).toEqual([0, 0, 0, 0]);
});
it("replays the newest frame after real context loss without affecting another instance", async () => {
  const a = fixture();
  const b = fixture();
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
  const extension = a.gl.getExtension("WEBGL_lose_context")!;
  expect(extension).toBeTruthy();
  const lost = new Promise<void>((resolve) =>
    a.canvas.addEventListener("webglcontextlost", () => resolve(), {
      once: true,
    }),
  );
  extension.loseContext();
  await lost;
  expect(a.gpu.available).toBe(false);
  a.gpu.draw([{ ...shape, fill: { color: [0, 1, 0, 1] } }], a.view);
  b.gpu.draw([shape], b.view);
  expect(b.pixel(50, 50)).toEqual([255, 0, 0, 255]);
  const restored = new Promise<void>((resolve) =>
    a.canvas.addEventListener("webglcontextrestored", () => resolve(), {
      once: true,
    }),
  );
  // Restoration is legal after the loss event dispatch task has completed.
  await new Promise((resolve) => setTimeout(resolve, 0));
  extension.restoreContext();
  await restored;
  expect(a.gpu.available).toBe(true);
  expect(a.pixel(50, 50)).toEqual([0, 255, 0, 255]);
});

it("composites multiple renderers on one context and resets hostile GL state", () => {
  const { gpu, canvas, gl, view, pixel } = fixture();
  const second = createGpuVector(canvas);
  cleanup.push(() => second.dispose());
  const square = points([
    [10, 10],
    [60, 10],
    [60, 60],
    [10, 60],
  ]);
  gpu.draw([{ contours: [square], fill: red }], view);
  gl.enable(gl.DEPTH_TEST);
  gl.enable(gl.CULL_FACE);
  gl.enable(gl.STENCIL_TEST);
  gl.stencilFunc(gl.NEVER, 0, 0xff);
  gl.enable(gl.SCISSOR_TEST);
  gl.scissor(0, 0, 0, 0);
  gl.colorMask(false, false, false, false);
  gl.blendEquation(gl.FUNC_SUBTRACT);
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
  expect(pixel(20, 20)).toEqual([255, 0, 0, 255]);
  const blended = pixel(50, 50);
  expect(blended[0]).toBeGreaterThanOrEqual(127);
  expect(blended[0]).toBeLessThanOrEqual(128);
  expect(blended.slice(1)).toEqual([128, 0, 255]);
  expect(pixel(80, 80)).toEqual([0, 128, 0, 128]);
  second.dispose();
  gpu.draw([{ contours: [square], fill: red }], view);
  expect(pixel(20, 20)).toEqual([255, 0, 0, 255]);
  expect(pixel(80, 80)).toEqual([0, 0, 0, 0]);
});
it("uses multisample coverage for diagonal fill and round stroke edges", () => {
  const { gpu, gl, view } = fixture();
  expect(gl.getContextAttributes()?.antialias).toBe(true);
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
  const pixels = new Uint8Array(100 * 100 * 4);
  gl.readPixels(0, 0, 100, 100, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  let partial = 0;
  for (let i = 3; i < pixels.length; i += 4) {
    if (pixels[i] > 0 && pixels[i] < 255) {
      partial++;
    }
  }
  expect(partial).toBeGreaterThan(20);
});

it("interleaves vector, point, and vector geometry in series order on one canvas", () => {
  const { gpu, canvas, view, pixel } = fixture();
  const dots = createGpuPoints(canvas);
  cleanup.push(() => dots.dispose());
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
    { length: 1, buffers: () => ({ positions: new Float32Array([0.5, 0.5]) }) },
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
  expect(pixel(50, 50)).toEqual([0, 255, 0, 255]);
  expect(pixel(20, 20)).toEqual([255, 0, 0, 255]);
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
  expect(pixel(50, 50)).toEqual([0, 0, 255, 255]);
  expect(pixel(60, 50)).toEqual([0, 255, 0, 255]);
  expect(pixel(20, 20)).toEqual([255, 0, 0, 255]);
});
