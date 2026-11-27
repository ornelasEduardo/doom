import { expect, it } from "vitest";

import { registerGpuMark } from "../../../components/Chart/rendering/scene";
import { hasWebGpu } from "./webgpu-readback";
import { snapshotGpu } from "./webgpu-snapshot";

const gpuIt = it.skipIf(!(await hasWebGpu()));

gpuIt.each([
  { dash: "8 8", offset: "0", cap: "butt", hit: 14, gap: 22 },
  { dash: "8 8", offset: "4", cap: "butt", hit: 12, gap: 16 },
  { dash: "8", offset: "0", cap: "butt", hit: 14, gap: 22 },
])(
  "preserves SVG dash style $dash offset $offset",
  async ({ dash, offset, cap, hit, gap }) => {
    const host = document.createElement("div");
    document.body.append(host);
    host.innerHTML = `<svg width="100" height="100"><path data-chart-gpu-mark="path" fill="none" stroke="red" stroke-width="4" stroke-dasharray="${dash}" stroke-dashoffset="${offset}" stroke-linecap="${cap}"/></svg>`;
    const release = registerGpuMark(host.querySelector("path")!, {
      kind: "path",
      contours: [
        {
          points: [
            { x: 10, y: 50 },
            { x: 90, y: 50 },
          ],
          closed: false,
        },
      ],
    });
    try {
      const p = await new Promise<number[]>((resolve) =>
        requestAnimationFrame(async () => {
          const gl = await snapshotGpu(host.querySelector("canvas")!);
          resolve(
            [hit, gap].map((x) => {
              const out = new Uint8Array(4);
              gl.readPixels(x, 49, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, out);
              return out[3];
            }),
          );
        }),
      );
      expect(p).toEqual([255, 0]);
    } finally {
      release();
      host.remove();
    }
  },
);
gpuIt.each(["butt", "square", "round"])(
  "respects %s stroke caps",
  async (cap) => {
    const host = document.createElement("div");
    document.body.append(host);
    host.innerHTML = `<svg width="100" height="100"><path data-chart-gpu-mark="path" fill="none" stroke="red" stroke-width="10" stroke-linecap="${cap}"/></svg>`;
    const release = registerGpuMark(host.querySelector("path")!, {
      kind: "path",
      contours: [
        {
          points: [
            { x: 20, y: 50 },
            { x: 80, y: 50 },
          ],
          closed: false,
        },
      ],
    });
    try {
      const p = await new Promise<number>((resolve) =>
        requestAnimationFrame(async () => {
          const gl = await snapshotGpu(host.querySelector("canvas")!);
          const out = new Uint8Array(4);
          gl.readPixels(17, 49, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, out);
          resolve(out[3]);
        }),
      );
      expect(p).toBe(cap === "butt" ? 0 : 255);
    } finally {
      release();
      host.remove();
    }
  },
);

gpuIt.each(["miter", "round", "bevel"])("preserves %s joins", async (join) => {
  const host = document.createElement("div");
  document.body.append(host);
  host.innerHTML = `<svg width="100" height="100"><path data-chart-gpu-mark="path" fill="none" stroke="red" stroke-width="10" stroke-linejoin="${join}"/></svg>`;
  const release = registerGpuMark(host.querySelector("path")!, {
    kind: "path",
    contours: [
      {
        points: [
          { x: 20, y: 70 },
          { x: 50, y: 40 },
          { x: 80, y: 70 },
        ],
        closed: false,
      },
    ],
  });
  try {
    const alpha = await new Promise<number>((resolve) =>
      requestAnimationFrame(async () => {
        const gl = await snapshotGpu(host.querySelector("canvas")!);
        const p = new Uint8Array(4);
        gl.readPixels(50, 65, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, p);
        resolve(p[3]);
      }),
    );
    expect(alpha).toBe(join === "miter" ? 255 : 0);
  } finally {
    release();
    host.remove();
  }
});
gpuIt(
  "preserves local dash lengths under nonuniform SVG transforms",
  async () => {
    const host = document.createElement("div");
    document.body.append(host);
    host.innerHTML =
      '<svg width="100" height="100"><g transform="scale(2 .5)"><path data-chart-gpu-mark="path" fill="none" stroke="red" stroke-width="8" stroke-dasharray="8 8" stroke-linecap="butt"/></g></svg>';
    const release = registerGpuMark(host.querySelector("path")!, {
      kind: "path",
      contours: [
        {
          points: [
            { x: 10, y: 100 },
            { x: 45, y: 100 },
          ],
          closed: false,
        },
      ],
    });
    try {
      const pixels = await new Promise<number[]>((resolve) =>
        requestAnimationFrame(async () => {
          const gl = await snapshotGpu(host.querySelector("canvas")!);
          resolve(
            [28, 44].map((x) => {
              const p = new Uint8Array(4);
              gl.readPixels(x, 49, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, p);
              return p[3];
            }),
          );
        }),
      );
      expect(pixels).toEqual([255, 0]);
    } finally {
      release();
      host.remove();
    }
  },
);
