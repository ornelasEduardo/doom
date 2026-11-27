import { expect, it, vi } from "vitest";

import { registerGpuMark } from "../../../components/Chart/rendering/scene";

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
    // Let mutation observers enqueue the scene draw before the readback frame.
    await Promise.resolve();
    return new Promise<number[]>((resolve) =>
      requestAnimationFrame(() => {
        const c = host.querySelector("canvas")!;
        const gl = c.getContext("webgl2")!;
        const p = new Uint8Array(4);
        gl.readPixels(x, 49, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, p);
        resolve([...p]);
      }),
    );
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
it("composites overlapping marks once for each nested opacity group", async () => {
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
});
it("reads intended fill and stroke opacity without painting semantic SVG", async () => {
  const f = fixture();
  const n = f.point(45);
  n.style.fillOpacity = "0.25";
  n.style.stroke = "blue";
  n.style.strokeWidth = "4";
  n.style.strokeOpacity = "0.5";
  try {
    const pixels = await new Promise<number[][]>((resolve) =>
      requestAnimationFrame(() => {
        const gl = f.host.querySelector("canvas")!.getContext("webgl2")!;
        resolve(
          [45, 60].map((x) => {
            const p = new Uint8Array(4);
            gl.readPixels(x, 49, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, p);
            return [...p];
          }),
        );
      }),
    );
    expect(pixels[0]).toEqual([64, 0, 0, 64]);
    expect(pixels[1]).toEqual([0, 0, 128, 128]);
    expect(getComputedStyle(n).filter).toBe("opacity(0)");
  } finally {
    f.cleanup();
  }
});
it("reports unavailable rendering when WebGL2 global is absent and cleans up", async () => {
  const f = fixture();
  vi.stubGlobal("WebGL2RenderingContext", undefined);
  f.point(45);
  try {
    await new Promise(requestAnimationFrame);
    expect(f.host.querySelector('[role="status"]')?.textContent).toContain(
      "GPU rendering is unavailable",
    );
  } finally {
    vi.unstubAllGlobals();
    f.cleanup();
  }
  await Promise.resolve();
  expect(f.host.querySelector("canvas")).toBeNull();
  expect(f.host.querySelector('[role="status"]')).toBeNull();
});

it("reads path fill and stroke opacity independently", async () => {
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
    const pixels = await new Promise<number[][]>((resolve) =>
      requestAnimationFrame(() => {
        const c = f.host.querySelector("canvas")!;
        const gl = c.getContext("webgl2")!;
        resolve(
          [45, 17].map((x) => {
            const p = new Uint8Array(4);
            gl.readPixels(x, 49, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, p);
            return [...p];
          }),
        );
      }),
    );
    expect(pixels[0]).toEqual([64, 0, 0, 64]);
    expect(pixels[1]).toEqual([0, 0, 128, 128]);
  } finally {
    release();
    f.cleanup();
  }
});

it("keeps cloud point opacity separate from ancestor group opacity", async () => {
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
});

it("releases nested layer resources on resize, opacity removal and disposal", async () => {
  const f = fixture();
  f.group.style.opacity = "0.5";
  const inner = document.createElementNS(ns, "g");
  inner.style.opacity = "0.5";
  f.group.append(inner);
  f.point(45, inner);
  const gl = f.host
    .querySelector("canvas")!
    .getContext("webgl2", { stencil: true, antialias: true })!;
  const created = vi.spyOn(gl, "createFramebuffer"),
    deleted = vi.spyOn(gl, "deleteFramebuffer");
  const textures = vi.spyOn(gl, "createTexture"),
    deletedTextures = vi.spyOn(gl, "deleteTexture");
  const buffers = vi.spyOn(gl, "createRenderbuffer"),
    deletedBuffers = vi.spyOn(gl, "deleteRenderbuffer");
  try {
    expect((await f.pixel())[3]).toBe(64);
    expect(created).toHaveBeenCalledTimes(4);
    f.svg.setAttribute("width", "120");
    expect((await f.pixel())[3]).toBe(64);
    expect(created).toHaveBeenCalledTimes(8);
    expect(deleted).toHaveBeenCalledTimes(4);
    inner.style.opacity = "1";
    f.group.style.opacity = "1";
    expect((await f.pixel())[3]).toBe(255);
    expect(deleted).toHaveBeenCalledTimes(8);
    inner.style.opacity = "0.5";
    f.group.style.opacity = "0.5";
    expect((await f.pixel())[3]).toBe(64);
    f.cleanup();
    await Promise.resolve();
    expect(deleted.mock.calls.length).toBe(created.mock.calls.length);
    expect(deletedTextures.mock.calls.length).toBe(textures.mock.calls.length);
    expect(deletedBuffers.mock.calls.length).toBe(buffers.mock.calls.length);
  } finally {
    f.cleanup();
    vi.restoreAllMocks();
  }
});

it("rebuilds nested opacity layers after context restoration without stale targets", async () => {
  const f = fixture();
  f.group.style.opacity = "0.5";
  const inner = document.createElementNS(ns, "g");
  inner.style.opacity = "0.5";
  f.group.append(inner);
  f.point(45, inner);
  try {
    expect((await f.pixel())[3]).toBe(64);
    const canvas = f.host.querySelector("canvas")!,
      gl = canvas.getContext("webgl2")!,
      ext = gl.getExtension("WEBGL_lose_context")!;
    ext.loseContext();
    await expect.poll(() => canvas.dataset.chartGpu).toBe("unavailable");
    const restored = new Promise((resolve) =>
      canvas.addEventListener("webglcontextrestored", resolve, { once: true }),
    );
    ext.restoreContext();
    await restored;
    expect((await f.pixel())[3]).toBe(64);
    expect(gl.getError()).toBe(gl.NO_ERROR);
  } finally {
    f.cleanup();
  }
});

it("redraws referenced clip geometry on resize and replacement without another event", async () => {
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
});
