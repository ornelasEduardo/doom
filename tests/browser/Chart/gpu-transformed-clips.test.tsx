import { expect, it } from "vitest";

import { registerGpuMark } from "../../../components/Chart/rendering/scene";
import { hasWebGpu } from "./webgpu-readback";
import { snapshotGpu } from "./webgpu-snapshot";

const gpuIt = it.skipIf(!(await hasWebGpu()));

const ns = "http://www.w3.org/2000/svg";
let sequence = 0;
function fixture() {
  const host = document.createElement("div");
  document.body.append(host);
  const svg = document.createElementNS(ns, "svg");
  svg.setAttribute("width", "120");
  svg.setAttribute("height", "120");
  host.append(svg);
  const defs = document.createElementNS(ns, "defs");
  const group = document.createElementNS(ns, "g");
  svg.append(defs, group);
  const releases: (() => void)[] = [];
  function clip(
    parent: SVGGraphicsElement,
    attributes: Record<string, string>,
  ) {
    const path = document.createElementNS(ns, "clipPath");
    path.id = `transformed-clip-${sequence++}`;
    const rect = document.createElementNS(ns, "rect");
    Object.entries(attributes).forEach(([key, value]) =>
      rect.setAttribute(key, value),
    );
    path.append(rect);
    defs.append(path);
    parent.setAttribute("clip-path", `url(#${path.id})`);
    return { path, rect };
  }
  function mark(kind: "point" | "path", parent = group) {
    const node = document.createElementNS(
      ns,
      kind === "point" ? "circle" : "path",
    );
    node.style.fill = "red";
    node.dataset.chartGpuMark = kind;
    parent.append(node);
    releases.push(
      registerGpuMark(
        node,
        kind === "point"
          ? { kind, x: 20, y: 20, radius: 18 }
          : {
              kind,
              contours: [
                {
                  closed: true,
                  points: [
                    { x: -50, y: -50 },
                    { x: 150, y: -50 },
                    { x: 150, y: 150 },
                    { x: -50, y: 150 },
                  ],
                },
              ],
            },
      ),
    );
  }
  async function pixels(points: [number, number][]) {
    await Promise.resolve();
    return new Promise<number[]>((resolve) =>
      requestAnimationFrame(async () => {
        const canvas = host.querySelector("canvas")!;
        const gl = await snapshotGpu(canvas);
        const ratio = canvas.width / 120;
        const result = points.map(([x, y]) => {
          const rgba = new Uint8Array(4);
          gl.readPixels(
            Math.floor(x * ratio),
            canvas.height - 1 - Math.floor(y * ratio),
            1,
            1,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            rgba,
          );
          return rgba[3];
        });

        resolve(result);
      }),
    );
  }
  return {
    host,
    svg,
    defs,
    group,
    clip,
    mark,
    pixels,
    cleanup() {
      releases.forEach((release) => release());
      host.remove();
    },
  };
}

gpuIt.each(["point", "path"] as const)(
  "keeps rotated rectangle clipping exact for %s marks",
  async (kind) => {
    const f = fixture();
    f.group.setAttribute("transform", "translate(60 20) rotate(45)");
    f.clip(f.group, { width: "40", height: "40" });
    f.mark(kind);
    try {
      // Center lies inside the diamond; (35,25) lies in its bounding box but outside it.
      expect(
        await f.pixels([
          [60, 48],
          [35, 25],
        ]),
      ).toEqual([255, 0]);
    } finally {
      f.cleanup();
    }
  },
);

gpuIt("composes clipPath and rectangle transforms", async () => {
  const f = fixture();
  const { path } = f.clip(f.group, {
    width: "30",
    height: "100",
    transform: "translate(40 0)",
  });
  path.setAttribute("transform", "translate(20 0)");
  f.mark("path");
  try {
    expect(
      await f.pixels([
        [75, 50],
        [45, 50],
      ]),
    ).toEqual([255, 0]);
  } finally {
    f.cleanup();
  }
});

gpuIt(
  "intersects nested transformed clips without expanding their bounds",
  async () => {
    const f = fixture();
    f.clip(f.group, { x: "0", y: "0", width: "60", height: "120" });
    const inner = document.createElementNS(ns, "g");
    inner.setAttribute("transform", "translate(60 20) rotate(45)");
    f.group.append(inner);
    f.clip(inner, { width: "40", height: "40" });
    f.mark("path", inner);
    try {
      expect(
        await f.pixels([
          [50, 48],
          [70, 48],
          [35, 25],
        ]),
      ).toEqual([255, 0, 0]);
    } finally {
      f.cleanup();
    }
  },
);

gpuIt("retains reflected rectangle clips and empty intersections", async () => {
  const f = fixture();
  f.group.setAttribute("transform", "translate(100 0) scale(-1 1)");
  f.clip(f.group, { width: "40", height: "100" });
  f.mark("path");
  try {
    expect(
      await f.pixels([
        [80, 50],
        [50, 50],
      ]),
    ).toEqual([255, 0]);
    f.clip(f.group, { x: "200", width: "10", height: "100" });
    expect(await f.pixels([[80, 50]])).toEqual([0]);
  } finally {
    f.cleanup();
  }
});

gpuIt(
  "normalizes percentage rectangle lengths in object bounding box clips",
  async () => {
    const f = fixture();
    const { path } = f.clip(f.group, { width: "50%", height: "100%" });
    path.setAttribute("clipPathUnits", "objectBoundingBox");
    f.mark("point");
    const point = f.group.querySelector("circle")!;
    point.setAttribute("cx", "20");
    point.setAttribute("cy", "20");
    point.setAttribute("r", "18");
    try {
      expect(
        await f.pixels([
          [10, 20],
          [30, 20],
        ]),
      ).toEqual([255, 0]);
    } finally {
      f.cleanup();
    }
  },
);

gpuIt(
  "uses actual dense point bounds for object bounding box clips",
  async () => {
    const f = fixture();
    const { path } = f.clip(f.group, { width: ".5", height: "1" });
    path.setAttribute("clipPathUnits", "objectBoundingBox");
    const cloud = document.createElementNS(ns, "g");
    cloud.dataset.chartGpuMark = "cloud";
    cloud.style.fill = "red";
    const proxy = document.createElementNS(ns, "circle");
    proxy.setAttribute("r", "0");
    cloud.append(proxy);
    f.group.append(cloud);
    const release = registerGpuMark(cloud, {
      kind: "cloud",
      seriesId: "cloud",
      positions: new Float32Array([30, 50, 70, 50]),
      radii: new Float32Array([10, 10]),
      dataIndices: new Int32Array([0, 1]),
      radius: 10,
    });
    try {
      expect(
        await f.pixels([
          [30, 50],
          [70, 50],
        ]),
      ).toEqual([255, 0]);
    } finally {
      release();
      f.cleanup();
    }
  },
);

gpuIt(
  "respects CSS transforms and origins on clip definition geometry",
  async () => {
    const f = fixture();
    const { rect } = f.clip(f.group, {
      x: "20",
      y: "30",
      width: "40",
      height: "20",
      transform: "translate(70 0)",
    });
    // CSS overrides the SVG attribute and rotates around an explicit local origin.
    rect.style.transform = "rotate(90deg)";
    rect.style.transformOrigin = "40px 40px";
    f.mark("path");
    try {
      expect(
        await f.pixels([
          [40, 25],
          [25, 40],
        ]),
      ).toEqual([255, 0]);
    } finally {
      f.cleanup();
    }
  },
);

gpuIt(
  "treats a collapsed ancestor clip as empty even with a valid child clip",
  async () => {
    const f = fixture();
    f.clip(f.group, { width: "100", height: "100", transform: "scale(0)" });
    const inner = document.createElementNS(ns, "g");
    f.group.append(inner);
    f.clip(inner, { width: "100", height: "100" });
    f.mark("path", inner);
    try {
      expect(await f.pixels([[50, 50]])).toEqual([0]);
    } finally {
      f.cleanup();
    }
  },
);
