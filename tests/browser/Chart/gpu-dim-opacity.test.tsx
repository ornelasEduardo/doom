import { select } from "d3-selection";
import { expect, it } from "vitest";

import { Dim } from "../../../components/Chart/behaviors/Dim";
import { registerGpuMark } from "../../../components/Chart/rendering/scene";
import { createChartStore } from "../../../components/Chart/state/store/chart.store";
import type { BehaviorContext } from "../../../components/Chart/types/events";
import { hasWebGpu } from "./webgpu-readback";
import { snapshotGpu } from "./webgpu-snapshot";

const gpuIt = it.skipIf(!(await hasWebGpu()));

const ns = "http://www.w3.org/2000/svg";
// Attribute-based selection flags and uniform opacity can round either side
// of an 8-bit alpha midpoint; allow one framebuffer quantization step.
function expectMatchingPoints(pixels: number[]) {
  expect(Math.abs(pixels[2] - pixels[0])).toBeLessThanOrEqual(1);
  expect(Math.abs(pixels[3] - pixels[1])).toBeLessThanOrEqual(1);
}
function fixture(baseline: number) {
  const host = document.createElement("div");
  document.body.append(host);
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("width", "120");
  svg.setAttribute("height", "100");
  host.append(svg);
  const root = document.createElementNS(ns, "g");
  svg.append(root);
  const data = [{ id: 0 }, { id: 1 }];
  const releases: (() => void)[] = [];
  [20, 40].forEach((x, i) => {
    const node = document.createElementNS(ns, "circle");
    node.style.fill = "red";
    node.style.opacity = String(baseline);
    node.dataset.chartGpuMark = "point";
    Object.assign(node, { __data__: data[i] });
    root.append(node);
    releases.push(
      registerGpuMark(node, { kind: "point", x, y: 50, radius: 5 }),
    );
  });
  const cloud = document.createElementNS(ns, "g");
  cloud.style.fill = "red";
  cloud.style.opacity = String(baseline);
  cloud.dataset.chartGpuMark = "cloud";
  const proxy = document.createElementNS(ns, "circle");
  proxy.dataset.chartGpuSelectorProxy = "";
  cloud.append(proxy);
  root.append(cloud);
  releases.push(
    registerGpuMark(cloud, {
      kind: "cloud",
      seriesId: "s",
      positions: new Float32Array([80, 50, 100, 50]),
      radii: new Float32Array([5, 5]),
      dataIndices: new Int32Array([0, 1]),
      dataAt: (i) => data[i],
      radius: 5,
    }),
  );
  const store = createChartStore({});
  const start = (active: number, opacity: number) => {
    const context = {
      getChartContext: () => ({ g: select(root), chartStore: store }),
      getInteraction: () => ({
        targets: [
          {
            data: data[active],
            seriesId: "s",
            dataIndex: active,
            coordinate: { x: 20, y: 50 },
          },
        ],
      }),
    } as unknown as BehaviorContext;
    return Dim({ selector: "circle", opacity })(context)!;
  };
  const pixels = async () => {
    await Promise.resolve();
    window.dispatchEvent(new Event("resize"));
    return new Promise<number[]>((resolve) =>
      requestAnimationFrame(async () => {
        const canvas = host.querySelector("canvas")!,
          gl = await snapshotGpu(canvas);
        resolve(
          [20, 40, 80, 100].map((x) => {
            const pixel = new Uint8Array(4);
            gl.readPixels(x, 49, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
            return pixel[3];
          }),
        );
      }),
    );
  };
  return {
    start,
    pixels,
    cleanup: () => {
      releases.forEach((release) => release());
      host.remove();
    },
  };
}

gpuIt.each([0, 0.2, 0.8])(
  "matches ordinary Dim opacity and restores baseline %s",
  async (baseline) => {
    const f = fixture(baseline);
    const release = f.start(0, 0.3);
    try {
      const pixels = await f.pixels();
      expect(pixels[2]).toBe(pixels[0]);
      expect(pixels[3]).toBe(pixels[1]);
      expect(pixels[1]).toBeGreaterThanOrEqual(76);
      expect(pixels[0]).toBeCloseTo(baseline * 255, 0);
      release();
      const restored = await f.pixels();
      expect(restored[2]).toBe(restored[0]);
      expect(restored[3]).toBe(restored[1]);
      expect(restored[3]).toBeCloseTo(baseline * 255, 0);
    } finally {
      release();
      f.cleanup();
    }
  },
);

gpuIt(
  "matches independent Dim owner precedence and out-of-order detach",
  async () => {
    const f = fixture(0.2),
      older = f.start(0, 0.3),
      newer = f.start(1, 0.6);
    try {
      const both = await f.pixels();
      expectMatchingPoints(both);
      expect(both[0]).toBeCloseTo(0.6 * 255, 0);
      expect(Math.abs(both[1] - 0.3 * 255)).toBeLessThanOrEqual(1);
      older();
      const remaining = await f.pixels();
      expectMatchingPoints(remaining);
      expect(remaining[1]).toBeCloseTo(0.2 * 255, 0);
      newer();
      const restored = await f.pixels();
      expectMatchingPoints(restored);
      expect(restored[0]).toBeCloseTo(0.2 * 255, 0);
    } finally {
      older();
      newer();
      f.cleanup();
    }
  },
);
