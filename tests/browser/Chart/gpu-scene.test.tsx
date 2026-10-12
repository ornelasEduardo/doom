import { expect, it } from "vitest";

import {
  readGpuEmphasis,
  updateGpuDimming,
} from "../../../components/Chart/rendering/gpu-effects";
import { registerGpuMark } from "../../../components/Chart/rendering/scene";

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
  const pixel = (x: number, y: number) => {
    const c = host.querySelector("canvas")!;
    const gl = c.getContext("webgl2")!;
    const p = new Uint8Array(4);
    gl.readPixels(x, c.height - 1 - y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, p);
    return Array.from(p);
  };
  return { host, svg, group, pixel };
}
it("cloud and small point radii agree under a scale transform", async () => {
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
    const colors = await new Promise<number[][]>((resolve) =>
      requestAnimationFrame(() => resolve([pixel(29, 40), pixel(79, 40)])),
    );
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
it.each(["group", "svg"] as const)(
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
it("transient restoration allocation failure recovers on a later frame", async () => {
  const { host, group } = setup();
  const a = document.createElementNS(ns, "circle");
  a.style.fill = "red";
  a.dataset.chartGpuMark = "point";
  group.append(a);
  const clean = registerGpuMark(a, { kind: "point", x: 50, y: 50, radius: 10 });
  let restoreAllocation: (() => void) | undefined;
  try {
    await new Promise((resolve) => requestAnimationFrame(resolve));
    const canvas = host.querySelector("canvas")!;
    const gl = canvas.getContext("webgl2")!;
    const ext = gl.getExtension("WEBGL_lose_context")!;
    ext.loseContext();
    await expect.poll(() => canvas.dataset.chartGpu).toBe("unavailable");
    const original = gl.createProgram;
    const allocate = original.bind(gl);
    let calls = 0;
    restoreAllocation = () => {
      gl.createProgram = original;
    };
    Reflect.set(gl, "createProgram", () => {
      calls++;
      return calls === 1 ? null : allocate();
    });
    const restored = new Promise((resolve) =>
      canvas.addEventListener("webglcontextrestored", resolve, { once: true }),
    );
    ext.restoreContext();
    await restored;
    await new Promise((resolve) => requestAnimationFrame(resolve));
    window.dispatchEvent(new Event("resize"));
    await new Promise((resolve) => requestAnimationFrame(resolve));
    expect(canvas.dataset.chartGpu).toBe("ready");
  } finally {
    restoreAllocation?.();
    clean();
    host.remove();
  }
});

it("inherits the SVG root opacity on its GPU marks", async () => {
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
