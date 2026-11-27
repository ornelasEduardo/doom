import { expect, it, vi } from "vitest";

import { registerGpuMark } from "../../../components/Chart/rendering/scene";
import { acquireWebGpuSurface } from "../../../components/Chart/rendering/webgpu-surface";
import { gpuReady, hasWebGpu, readGpuPixel } from "./webgpu-readback";

const gpuIt = it.skipIf(!(await hasWebGpu()));

const ns = "http://www.w3.org/2000/svg";
function fixture() {
  const host = document.createElement("div");
  document.body.append(host);
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("width", "100");
  svg.setAttribute("height", "100");
  host.append(svg);
  const group = document.createElementNS(ns, "g");
  svg.append(group);
  const releases: (() => void)[] = [];
  const point = (x: number, parent: SVGElement = group) => {
    const node = document.createElementNS(ns, "circle");
    node.style.fill = "red";
    node.dataset.chartGpuMark = "point";
    parent.append(node);
    releases.push(
      registerGpuMark(node, { kind: "point", x, y: 50, radius: 15 }),
    );
    return node;
  };
  const pixel = async (x = 45) => {
    await Promise.resolve();
    const canvas = host.querySelector("canvas")!;
    await gpuReady(canvas);
    return readGpuPixel(canvas, x, 50);
  };
  return {
    host,
    svg,
    group,
    point,
    pixel,
    cleanup: () => {
      releases.forEach((r) => r());
      host.remove();
    },
  };
}
gpuIt(
  "composites overlapping marks once for each nested opacity group",
  async () => {
    const f = fixture();
    f.group.style.opacity = "0.5";
    const inner = document.createElementNS(ns, "g");
    inner.style.opacity = "0.5";
    f.group.append(inner);
    f.point(40, inner);
    f.point(50, inner);
    try {
      const p = await f.pixel();
      expect(p[3]).toBeGreaterThanOrEqual(63);
      expect(p[3]).toBeLessThanOrEqual(64);
    } finally {
      f.cleanup();
    }
  },
);
gpuIt(
  "reads intended fill and stroke opacity without painting semantic SVG",
  async () => {
    const f = fixture();
    const n = f.point(45);
    n.style.fillOpacity = "0.25";
    n.style.stroke = "blue";
    n.style.strokeWidth = "4";
    n.style.strokeOpacity = "0.5";
    try {
      const pixels = await Promise.all([45, 60].map((x) => f.pixel(x)));
      expect(pixels[0]).toEqual([64, 0, 0, 64]);
      expect(pixels[1]).toEqual([0, 0, 128, 128]);
      expect(getComputedStyle(n).filter).toBe("opacity(0)");
    } finally {
      f.cleanup();
    }
  },
);
it("reports unavailable rendering when WebGPU is absent and cleans up", async () => {
  const f = fixture();
  // Some engines omit the API entirely; exercise that native absence as-is.
  if ("gpu" in navigator) {
    vi.spyOn(navigator, "gpu", "get").mockReturnValue(
      undefined as unknown as GPU,
    );
  }
  f.point(45);
  try {
    await new Promise(requestAnimationFrame);
    expect(f.host.querySelector('[role="status"]')?.textContent).toContain(
      "GPU rendering is unavailable",
    );
  } finally {
    vi.restoreAllMocks();
    f.cleanup();
  }
  await Promise.resolve();
  expect(f.host.querySelector("canvas")).toBeNull();
  expect(f.host.querySelector('[role="status"]')).toBeNull();
});

gpuIt("reads path fill and stroke opacity independently", async () => {
  const f = fixture();
  const path = document.createElementNS(ns, "path");
  path.dataset.chartGpuMark = "path";
  path.style.fill = "red";
  path.style.fillOpacity = "0.25";
  path.style.stroke = "blue";
  path.style.strokeOpacity = "0.5";
  path.style.strokeWidth = "10";
  f.group.append(path);
  const release = registerGpuMark(path, {
    kind: "path",
    contours: [
      {
        closed: true,
        points: [
          { x: 20, y: 20 },
          { x: 70, y: 20 },
          { x: 70, y: 70 },
          { x: 20, y: 70 },
        ],
      },
    ],
  });
  try {
    const pixels = await Promise.all([45, 17].map((x) => f.pixel(x)));
    expect(pixels[0]).toEqual([64, 0, 0, 64]);
    expect(pixels[1]).toEqual([0, 0, 128, 128]);
  } finally {
    release();
    f.cleanup();
  }
});

gpuIt(
  "keeps cloud point opacity separate from ancestor group opacity",
  async () => {
    const f = fixture();
    f.group.style.opacity = "0.5";
    const cloud = document.createElementNS(ns, "g");
    cloud.style.fill = "red";
    cloud.style.opacity = "0.5";
    cloud.dataset.chartGpuMark = "cloud";
    f.group.append(cloud);
    const release = registerGpuMark(cloud, {
      kind: "cloud",
      seriesId: "test",
      positions: new Float32Array([40, 50, 50, 50]),
      radii: new Float32Array([15, 15]),
      dataIndices: new Int32Array([0, 1]),
      radius: 15,
    });
    try {
      const p = await f.pixel();
      expect(p[3]).toBeGreaterThanOrEqual(95);
      expect(p[3]).toBeLessThanOrEqual(96);
    } finally {
      release();
      f.cleanup();
    }
  },
);

gpuIt(
  "releases nested layer resources on resize, opacity removal and disposal",
  async () => {
    const f = fixture();
    f.group.style.opacity = "0.5";
    const inner = document.createElementNS(ns, "g");
    inner.style.opacity = "0.5";
    f.group.append(inner);
    f.point(45, inner);
    const canvas = f.host.querySelector("canvas")!;
    await gpuReady(canvas);
    const surface = acquireWebGpuSurface(canvas);
    const created: GPUTexture[] = [];
    const destroyed: ReturnType<typeof vi.spyOn>[] = [];
    const create = surface.device.createTexture.bind(surface.device);
    vi.spyOn(surface.device, "createTexture").mockImplementation(
      (descriptor) => {
        const texture = create(descriptor);
        created.push(texture);
        destroyed.push(vi.spyOn(texture, "destroy"));
        return texture;
      },
    );
    try {
      expect((await f.pixel())[3]).toBe(64);
      f.svg.setAttribute("width", "120");
      expect((await f.pixel())[3]).toBe(64);
      expect(created.length).toBe(9);
      inner.style.opacity = "1";
      f.group.style.opacity = "1";
      expect((await f.pixel())[3]).toBe(255);
      expect(destroyed.filter((spy) => spy.mock.calls.length > 0)).toHaveLength(
        6,
      );
      inner.style.opacity = "0.5";
      f.group.style.opacity = "0.5";
      expect((await f.pixel())[3]).toBe(64);
      f.cleanup();
      await Promise.resolve();
      surface.release();
      expect(destroyed.every((spy) => spy.mock.calls.length === 1)).toBe(true);
    } finally {
      f.cleanup();
      vi.restoreAllMocks();
    }
  },
);

gpuIt(
  "rebuilds nested opacity layers after device recovery without stale targets",
  async () => {
    const f = fixture();
    f.group.style.opacity = "0.5";
    const inner = document.createElementNS(ns, "g");
    inner.style.opacity = "0.5";
    f.group.append(inner);
    f.point(45, inner);
    try {
      expect((await f.pixel())[3]).toBe(64);
      const canvas = f.host.querySelector("canvas")!;
      const surface = acquireWebGpuSurface(canvas);
      try {
        const old = surface.device;
        let sawLoss = false;
        const unsubscribe = surface.subscribe(() => {
          if (!surface.available) {
            sawLoss = true;
          }
        });
        old.destroy();
        await old.lost;
        await expect
          .poll(() => surface.available && surface.device !== old)
          .toBe(true);
        unsubscribe();
        expect(sawLoss).toBe(true);
        expect((await f.pixel())[3]).toBe(64);
        expect(surface.error).toBeUndefined();
      } finally {
        surface.release();
      }
    } finally {
      f.cleanup();
    }
  },
);

gpuIt(
  "redraws referenced clip geometry on resize and replacement without another event",
  async () => {
    const f = fixture();
    const defs = document.createElementNS(ns, "defs");
    const clip = document.createElementNS(ns, "clipPath");
    clip.id = "live-gpu-clip";
    const rect = document.createElementNS(ns, "rect");
    rect.setAttribute("width", "50");
    rect.setAttribute("height", "100");
    clip.append(rect);
    defs.append(clip);
    f.svg.prepend(defs);
    f.group.setAttribute("clip-path", "url(#live-gpu-clip)");
    f.point(80);
    try {
      expect((await f.pixel(80))[3]).toBe(0);
      rect.setAttribute("width", "100");
      expect((await f.pixel(80))[3]).toBe(255);
      const replacement = rect.cloneNode() as SVGRectElement;
      replacement.setAttribute("width", "50");
      clip.replaceChildren(replacement);
      expect((await f.pixel(80))[3]).toBe(0);
      clip.remove();
      expect((await f.pixel(80))[3]).toBe(255);
      defs.append(clip);
      expect((await f.pixel(80))[3]).toBe(0);
    } finally {
      f.cleanup();
    }
  },
);
