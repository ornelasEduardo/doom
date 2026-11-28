import { expect, it, vi } from "vitest";

import {
  readGpuEmphasis,
  updateGpuDimming,
} from "../../../components/Chart/rendering/gpu-effects";
import { registerGpuMark } from "../../../components/Chart/rendering/scene";
import { acquireWebGpuSurface } from "../../../components/Chart/rendering/webgpu-surface";
import { gpuReady, hasWebGpu, readGpuPixel } from "./webgpu-readback";

const gpuIt = it.skipIf(!(await hasWebGpu()));

const ns = "http://www.w3.org/2000/svg";
function setup() {
  const host = document.createElement("div");
  document.body.append(host);
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("width", "100");
  svg.setAttribute("height", "100");
  host.append(svg);
  const group = document.createElementNS(ns, "g");
  svg.append(group);
  const pixel = async (x: number, y: number) => {
    const canvas = host.querySelector("canvas")!;
    await gpuReady(canvas);
    return readGpuPixel(canvas, x, y);
  };
  return { host, svg, group, pixel };
}
gpuIt("cloud and small point radii agree under a scale transform", async () => {
  const { host, group, pixel } = setup();
  group.setAttribute("transform", "scale(2)");
  const a = document.createElementNS(ns, "circle");
  a.style.fill = "red";
  a.dataset.chartGpuMark = "point";
  group.append(a);
  const b = document.createElementNS(ns, "g");
  b.style.fill = "red";
  b.dataset.chartGpuMark = "cloud";
  group.append(b);
  const cleanA = registerGpuMark(a, { kind: "point", x: 10, y: 20, radius: 6 });
  const cleanB = registerGpuMark(b, {
    kind: "cloud",
    seriesId: "x",
    dataIndices: new Int32Array([0]),
    positions: new Float32Array([35, 20]),
    radii: new Float32Array([6]),
    radius: 6,
  });
  try {
    const colors = await Promise.all([pixel(29, 40), pixel(79, 40)]);
    expect(colors[0]).toEqual([255, 0, 0, 255]);
    expect(colors[1]).toEqual(colors[0]);
  } finally {
    cleanA();
    cleanB();
    host.remove();
  }
});
it("cloud custom selector reaches emphasis", () => {
  const { host, group } = setup();
  group.setAttribute("data-chart-type", "scatter");
  const proxy = document.createElementNS(ns, "circle");
  proxy.setAttribute("data-chart-gpu-selector-proxy", "");
  group.append(proxy);
  updateGpuDimming(group.parentElement!, 1, {
    selector: '[data-chart-type="scatter"]',
    targets: [
      { seriesId: "x", dataIndex: 0, data: {}, coordinate: { x: 0, y: 0 } },
    ],
    opacity: 0.3,
  });
  try {
    expect(readGpuEmphasis(group, "x", new Int32Array([0, 1]))).toBeDefined();
  } finally {
    updateGpuDimming(group.parentElement!, 1);
    host.remove();
  }
});
gpuIt.each(["group", "svg"] as const)(
  "display:none on %s hides registered marks",
  async (ancestor) => {
    const { host, svg, group, pixel } = setup();
    (ancestor === "svg" ? svg : group).style.display = "none";
    const a = document.createElementNS(ns, "circle");
    a.style.fill = "red";
    a.dataset.chartGpuMark = "point";
    group.append(a);
    const clean = registerGpuMark(a, {
      kind: "point",
      x: 50,
      y: 50,
      radius: 10,
    });
    try {
      const p = await new Promise<number[]>((resolve) =>
        requestAnimationFrame(() => resolve(pixel(50, 50))),
      );
      expect(p).toEqual([0, 0, 0, 0]);
    } finally {
      clean();
      host.remove();
    }
  },
);
gpuIt(
  "transient restoration allocation failure recovers on a later frame",
  async () => {
    const { host, group } = setup();
    const a = document.createElementNS(ns, "circle");
    a.style.fill = "red";
    a.dataset.chartGpuMark = "point";
    group.append(a);
    const clean = registerGpuMark(a, {
      kind: "point",
      x: 50,
      y: 50,
      radius: 10,
    });
    const canvas = host.querySelector("canvas")!;
    const surface = acquireWebGpuSurface(canvas);
    try {
      await gpuReady(canvas);
      const request = vi
        .spyOn(navigator.gpu, "requestAdapter")
        .mockRejectedValue(new Error("temporary adapter failure"));
      const old = surface.device;
      old.destroy();
      await old.lost;
      await expect.poll(() => canvas.dataset.chartGpu).toBe("unavailable");
      surface.recover();
      await surface.ready;
      expect(surface.available).toBe(false);
      expect(request).toHaveBeenCalled();
      request.mockRestore();
      window.dispatchEvent(new Event("resize"));
      await expect.poll(() => canvas.dataset.chartGpu).toBe("ready");
    } finally {
      vi.restoreAllMocks();
      surface.release();
      clean();
      host.remove();
    }
  },
);

gpuIt("inherits the SVG root opacity on its GPU marks", async () => {
  const { host, svg, group, pixel } = setup();
  svg.style.opacity = "0.5";
  const point = document.createElementNS(ns, "circle");
  point.style.fill = "red";
  group.append(point);
  const release = registerGpuMark(point, {
    kind: "point",
    x: 50,
    y: 50,
    radius: 10,
  });
  try {
    const rgba = await new Promise<number[]>((resolve) =>
      requestAnimationFrame(() => resolve(pixel(50, 50))),
    );
    expect(rgba[3]).toBeGreaterThanOrEqual(127);
    expect(rgba[3]).toBeLessThanOrEqual(128);
  } finally {
    release();
    host.remove();
  }
});

gpuIt("retries temporary adapter failure when mark style changes", async () => {
  const host = document.createElement("div");
  document.body.append(host);
  host.innerHTML =
    '<svg width="100" height="100"><circle data-chart-gpu-mark="point" style="fill:red" /></svg>';
  const node = host.querySelector("circle")!;
  const release = registerGpuMark(node, {
    kind: "point",
    x: 50,
    y: 50,
    radius: 10,
  });
  const canvas = host.querySelector("canvas")!;
  const surface = acquireWebGpuSurface(canvas);
  try {
    await gpuReady(canvas);
    const request = vi
      .spyOn(navigator.gpu, "requestAdapter")
      .mockRejectedValue(new Error("temporary adapter failure"));
    const old = surface.device;
    old.destroy();
    await old.lost;
    await expect.poll(() => surface.error).toBe("temporary adapter failure");
    request.mockRestore();
    node.style.fill = "blue";
    await expect.poll(() => canvas.dataset.chartGpu).toBe("ready");
  } finally {
    vi.restoreAllMocks();
    release();
    surface.release();
    host.remove();
  }
});

gpuIt(
  "batches consecutive paths while preserving path-point-path scene order",
  async () => {
    const { host, group, pixel } = setup();
    const releases: (() => void)[] = [];
    const path = (
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      color: string,
    ) => {
      const node = document.createElementNS(ns, "path");
      node.dataset.chartGpuMark = "path";
      node.style.fill = color;
      group.append(node);
      releases.push(
        registerGpuMark(node, {
          kind: "path",
          contours: [
            {
              closed: true,
              points: [
                { x: x0, y: y0 },
                { x: x1, y: y0 },
                { x: x1, y: y1 },
                { x: x0, y: y1 },
              ],
            },
          ],
        }),
      );
    };
    path(10, 10, 70, 70, "red");
    path(40, 40, 90, 90, "blue");
    path(15, 75, 25, 85, "yellow");
    const point = document.createElementNS(ns, "circle");
    point.dataset.chartGpuMark = "point";
    point.style.fill = "lime";
    group.append(point);
    releases.push(
      registerGpuMark(point, { kind: "point", x: 50, y: 50, radius: 15 }),
    );
    path(45, 45, 55, 55, "white");
    const canvas = host.querySelector("canvas")!;
    const surface = acquireWebGpuSurface(canvas);
    try {
      await gpuReady(canvas);
      let passes = 0;
      const create = surface.device.createCommandEncoder.bind(surface.device);
      vi.spyOn(surface.device, "createCommandEncoder").mockImplementation(
        (descriptor) => {
          const encoder = create(descriptor);
          const begin = encoder.beginRenderPass.bind(encoder);
          vi.spyOn(encoder, "beginRenderPass").mockImplementation((pass) => {
            passes++;
            return begin(pass);
          });
          return encoder;
        },
      );
      window.dispatchEvent(new Event("resize"));
      await gpuReady(canvas);
      // Clear, the first three paths, the point, the last path, and final resolve.
      expect(passes).toBeLessThanOrEqual(5);
      expect(await pixel(20, 20)).toEqual([255, 0, 0, 255]);
      expect(await pixel(75, 75)).toEqual([0, 0, 255, 255]);
      expect(await pixel(20, 80)).toEqual([255, 255, 0, 255]);
      expect(await pixel(60, 50)).toEqual([0, 255, 0, 255]);
      expect(await pixel(50, 50)).toEqual([255, 255, 255, 255]);
    } finally {
      vi.restoreAllMocks();
      releases.forEach((release) => release());
      surface.release();
      host.remove();
    }
  },
);
