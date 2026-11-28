import "../../../styles/globals.scss";

import { afterEach, expect, it } from "vitest";

import { registerGpuMark } from "../../../components/Chart/rendering/scene";
import { compositedPixel } from "./composited-pixel";
import { hasWebGpu } from "./webgpu-readback";

const gpuIt = it.skipIf(!(await hasWebGpu()));
const dispose: (() => void)[] = [];
afterEach(() =>
  dispose
    .splice(0)
    .reverse()
    .forEach((release) => release()),
);

gpuIt.each([
  "matrix(0 1 -1 0 140 20)",
  "matrix(1 .4 .6 1 20 20)",
  "matrix(1 0 0 -1 20 100)",
])("preserves native area gradient coordinates under %s", async (transform) => {
  const host = document.createElement("div");
  host.style.cssText =
    "position:relative;width:220px;height:180px;background:white";
  host.innerHTML = `<svg width="220" height="180"><defs><linearGradient id="affine-gradient" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stop-color="red" stop-opacity=".8"/><stop offset="95%" stop-color="red" stop-opacity=".1"/></linearGradient></defs><g transform="${transform}"><path d="M0 0H100V60H0Z" fill="url(#affine-gradient)" /></g></svg>`;
  document.body.append(host);
  dispose.push(() => host.remove());
  let path = host.querySelector("path")!;
  const samples = [
    { x: 25, y: 12 },
    { x: 25, y: 48 },
    { x: 65, y: 12 },
  ];
  const pixel = async ({ x, y }: { x: number; y: number }) => {
    const point = new DOMPoint(x, y).matrixTransform(path.getScreenCTM()!);
    return compositedPixel(point.x, point.y);
  };
  const expected: number[][] = [];
  for (const sample of samples) {
    expected.push(await pixel(sample));
  }
  const semantic = path.cloneNode(true) as SVGPathElement;
  semantic.setAttribute("fill", "red");
  semantic.setAttribute("data-chart-gpu-mark", "path");
  path.replaceWith(semantic);
  path = semantic;
  dispose.push(
    registerGpuMark(path, {
      kind: "path",
      contours: [
        {
          points: [
            { x: 0, y: 0 },
            { x: 100, y: 0 },
            { x: 100, y: 60 },
            { x: 0, y: 60 },
          ],
          closed: true,
        },
      ],
      gradient: { startOpacity: 0.8, endOpacity: 0.1 },
    }),
  );
  await expect
    .poll(() => host.querySelector("canvas")?.dataset.chartGpu)
    .toBe("ready");
  for (let i = 0; i < samples.length; i++) {
    await expect
      .poll(
        async () => {
          const actual = await pixel(samples[i]);
          return Math.max(
            ...actual.map((value, channel) =>
              Math.abs(value - expected[i][channel]),
            ),
          );
        },
        { timeout: 5000 },
      )
      .toBeLessThanOrEqual(3);
  }
});
