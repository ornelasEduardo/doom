import { beforeEach, expect, it, vi } from "vitest";

import {
  createGpuPoints,
  type GpuView,
} from "../../../components/Chart/rendering/gpu";
import { registerGpuMark } from "../../../components/Chart/rendering/scene";
import { acquireWebGpuSurface } from "../../../components/Chart/rendering/webgpu-surface";
import {
  gpuReady,
  hasWebGpu,
  readGpuPixel,
  readGpuPixelsBottomUp,
} from "./webgpu-readback";

beforeEach(async ({ skip }) => {
  if (!(await hasWebGpu())) {
    skip();
  }
});
const bases = [
  { name: "nonuniform scale", values: [2, 0, 0, 1] },
  { name: "shear", values: [1, 0.5, 1, 1] },
  { name: "reflection and shear", values: [-2, 0, 0.5, 1] },
  { name: "rotated nonuniform scale", values: [0, 2, -1, 0] },
];
for (const kind of ["point", "cloud"] as const) {
  it.each(
    bases.flatMap((basis) => [1, 2].map((ratio) => ({ ...basis, ratio }))),
  )(
    `preserves the transformed ${kind} fill and centered stroke under $name at DPR $ratio`,
    async ({ values, ratio }) => {
      vi.stubGlobal("devicePixelRatio", ratio);
      const ns = "http://www.w3.org/2000/svg";
      const host = document.createElement("div");
      document.body.append(host);
      const svg = document.createElementNS(ns, "svg");
      svg.setAttribute("width", "120");
      svg.setAttribute("height", "120");
      host.append(svg);
      const group = document.createElementNS(ns, "g");
      svg.append(group);
      const [a, b, c, d] = values;
      group.setAttribute(
        "transform",
        `matrix(${a} ${b} ${c} ${d} ${60 - a * 30 - c * 30} ${60 - b * 30 - d * 30})`,
      );
      const node = document.createElementNS(
        ns,
        kind === "point" ? "circle" : "g",
      );
      node.dataset.chartGpuMark = kind;
      node.style.fill = "red";
      node.style.stroke = "blue";
      node.style.strokeWidth = "4";
      group.append(node);
      const release = registerGpuMark(
        node,
        kind === "point"
          ? { kind, x: 30, y: 30, radius: 10 }
          : {
              kind,
              seriesId: "s",
              positions: new Float32Array([30, 30]),
              radii: new Float32Array([10]),
              dataIndices: new Int32Array([0]),
              radius: 10,
            },
      );
      try {
        const canvas = host.querySelector("canvas")!;
        await gpuReady(canvas);
        const pixels = await readGpuPixelsBottomUp(canvas);
        const errors: string[] = [];
        let fills = 0,
          strokes = 0;
        for (let y = 25 * ratio; y < 95 * ratio; y++) {
          for (let x = 25 * ratio; x < 95 * ratio; x++) {
            const dx = (x + 0.5) / ratio - 60,
              dy = (y + 0.5) / ratio - 60,
              det = a * d - b * c;
            const distance = Math.hypot(
              (d * dx - c * dy) / det,
              (-b * dx + a * dy) / det,
            );
            const pixel = Array.from(
              pixels.slice(
                ((120 * ratio - 1 - y) * 120 * ratio + x) * 4,
                ((120 * ratio - 1 - y) * 120 * ratio + x) * 4 + 4,
              ),
            );
            if (distance < 6) {
              fills++;
              if (pixel.join() !== "255,0,0,255") {
                errors.push(`fill ${x},${y}: ${pixel}`);
              }
            }
            const localX = (d * dx - c * dy) / det;
            const localY = (-b * dx + a * dy) / det;
            const ramp =
              distance === 0
                ? 1
                : Math.hypot(
                    (d * localX - b * localY) / det / distance,
                    (-c * localX + a * localY) / det / distance,
                  );
            if (distance > 8 + ramp / ratio && distance < 12 - ramp / ratio) {
              strokes++;
              if (pixel.join() !== "0,0,255,255") {
                errors.push(`stroke ${x},${y}: ${pixel}`);
              }
            }
            if (distance > 15 && pixel[3] !== 0) {
              errors.push(`outside ${x},${y}: ${pixel}`);
            }
          }
        }
        expect(fills).toBeGreaterThan(0);
        expect(strokes).toBeGreaterThan(0);
        expect(errors.slice(0, 10)).toEqual([]);
      } finally {
        release();
        host.remove();
        vi.unstubAllGlobals();
      }
    },
  );
}

it("updates a retained cloud's affine basis without replacing its source", async () => {
  const ns = "http://www.w3.org/2000/svg",
    host = document.createElement("div");
  document.body.append(host);
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("width", "120");
  svg.setAttribute("height", "120");
  host.append(svg);
  const node = document.createElementNS(ns, "g");
  node.dataset.chartGpuMark = "cloud";
  node.style.fill = "red";
  svg.append(node);
  node.setAttribute("transform", "matrix(2 0 0 1 0 30)");
  const release = registerGpuMark(node, {
    kind: "cloud",
    seriesId: "s",
    positions: new Float32Array([30, 30]),
    radii: new Float32Array([10]),
    dataIndices: new Int32Array([0]),
    radius: 10,
  });
  const read = async () => {
    const canvas = host.querySelector("canvas")!;
    await gpuReady(canvas);
    return Promise.all(
      [
        [77, 60],
        [60, 77],
      ].map(async ([x, y]) => (await readGpuPixel(canvas, x, y))[3]),
    );
  };
  try {
    expect(await read()).toEqual([255, 0]);
    node.setAttribute("transform", "matrix(1 0 0 2 30 0)");
    expect(await read()).toEqual([0, 255]);
  } finally {
    release();
    host.remove();
  }
});

it("preserves large uniform/affine points through radius changes and device recovery", async () => {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 120;
  document.body.append(canvas);
  const gpu = createGpuPoints(canvas);
  await gpu.ready;
  const positions = new Float32Array([30.5, 60.5, 90.5, 60.5]);
  const large = {
    length: 2,
    buffers: () => ({ positions, radii: new Float32Array([8, 12]) }),
  };
  const small = {
    length: 2,
    buffers: () => ({ positions, radii: new Float32Array([3, 4]) }),
  };
  const view: GpuView = {
    width: 120,
    height: 120,
    plotWidth: 120,
    plotHeight: 120,
    k: 1,
    x: 0,
    y: 0,
    matrix: new DOMMatrix(),
    ratio: 1,
    radius: 8,
    color: [1, 0, 0, 1],
    stroke: { color: [0, 0, 1, 1], width: 4 },
    axes: {
      x: { type: "linear", domain: [0, 120] },
      y: { type: "linear", domain: [0, 120] },
    },
  };
  const pixel = (x: number, y: number) => readGpuPixel(canvas, x, y);
  const affine = { ...view, pointTransform: [2, 0, 0, 1] as const };
  const checkAffine = async () => {
    expect(await pixel(30, 60)).toEqual([255, 0, 0, 255]);
    expect(await pixel(90, 60)).toEqual([255, 0, 0, 255]);
    expect(await pixel(48, 60)).toEqual([0, 0, 255, 255]);
    expect(await pixel(116, 60)).toEqual([0, 0, 255, 255]);
    expect(await pixel(30, 78)).toEqual([0, 0, 0, 0]);
  };
  try {
    gpu.draw(large, { ...view, pointTransform: [2, 0, 0, 2] });
    expect(await pixel(48, 60)).toEqual([0, 0, 255, 255]);
    expect(await pixel(30, 78)).toEqual([0, 0, 255, 255]);
    gpu.draw(large, affine);
    await checkAffine();
    gpu.draw(small, { ...view, stroke: { color: [0, 0, 1, 1], width: 2 } });
    expect(await pixel(30, 60)).toEqual([255, 0, 0, 255]);
    expect(await pixel(90, 60)).toEqual([255, 0, 0, 255]);
    expect(await pixel(33, 60)).toEqual([0, 0, 255, 255]);
    expect(await pixel(94, 60)).toEqual([0, 0, 255, 255]);
    expect(await pixel(48, 60)).toEqual([0, 0, 0, 0]);
    gpu.draw(large, affine);
    await checkAffine();
    const surface = acquireWebGpuSurface(canvas);
    surface.device.destroy();
    await vi.waitFor(() => expect(gpu.available).toBe(false));
    gpu.recover();
    await vi.waitFor(() => expect(gpu.available, gpu.error).toBe(true));
    gpu.draw(large, affine);
    await checkAffine();
    surface.release();
  } finally {
    gpu.dispose();

    canvas.remove();
  }
});

it.each([undefined, [2, 0, 0, 1] as const])(
  "retains visible coverage when a point center lies outside the canvas (%s)",
  async (pointTransform) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 120;
    const gpu = createGpuPoints(canvas);
    await gpu.ready;
    const view: GpuView = {
      width: 120,
      height: 120,
      plotWidth: 120,
      plotHeight: 120,
      k: 1,
      x: 0,
      y: 0,
      matrix: new DOMMatrix(),
      ratio: 1,
      radius: 10,
      color: [1, 0, 0, 1],
      pointTransform,
      axes: {
        x: { type: "linear", domain: [0, 120] },
        y: { type: "linear", domain: [0, 120] },
      },
    };
    try {
      gpu.draw(
        {
          length: 1,
          buffers: () => ({ positions: new Float32Array([-5, 60.5]) }),
        },
        view,
      );
      const pixel = await readGpuPixel(canvas, 1, 60);
      expect([...pixel]).toEqual([255, 0, 0, 255]);
    } finally {
      gpu.dispose();
    }
  },
);
