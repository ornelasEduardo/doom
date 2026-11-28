import "../../../styles/globals.scss";

import { afterEach, expect, it, vi } from "vitest";

import { registerGpuMark } from "../../../components/Chart/rendering/scene";
import { compositedPixel } from "./composited-pixel";
import { hasWebGpu } from "./webgpu-readback";

const gpuIt = it.skipIf(!(await hasWebGpu()));
const releases: (() => void)[] = [];
afterEach(() => {
  releases
    .splice(0)
    .reverse()
    .forEach((release) => release());
  vi.restoreAllMocks();
});

function fixture(
  nested: boolean,
  viewBox?: string,
  preserveAspectRatio = "xMidYMid meet",
) {
  const host = document.createElement("div");
  host.style.cssText =
    "position:relative;width:160px;height:100px;background:white";
  const x = viewBox?.startsWith("100 ") ? 160 : 40;
  const mapping = viewBox
    ? `viewBox="${viewBox}" preserveAspectRatio="${preserveAspectRatio}"`
    : "";
  const circle = `<circle data-chart-gpu-mark="point" cx="${x}" cy="40" r="10" fill="red" />`;
  host.innerHTML = `<svg width="160" height="100" ${!nested ? mapping : ""}>${nested ? `<svg x="20" y="10" width="${viewBox ? 80 : 100}" height="80" ${mapping}>${circle}</svg>` : circle}</svg>`;
  document.body.append(host);
  releases.push(() => host.remove());
  const node = host.querySelector("circle")!;
  releases.push(registerGpuMark(node, { kind: "point", x, y: 40, radius: 10 }));
  return { host, node };
}

gpuIt.each([false, true])(
  "presents GPU marks in their SVG viewport (nested: %s)",
  async (nested) => {
    const { host, node } = fixture(nested);
    await expect
      .poll(() => host.querySelector("canvas")?.dataset.chartGpu, {
        timeout: 5000,
      })
      .toBe("ready");
    expect(!!host.querySelector("canvas")?.closest("foreignObject")).toBe(
      nested,
    );
    const point = new DOMPoint(40, 40).matrixTransform(node.getScreenCTM()!);
    await expect
      .poll(() => compositedPixel(point.x, point.y), { timeout: 5000 })
      .toEqual([255, 0, 0, 255]);
  },
);

it("places a nested SVG's unavailable status in the visible HTML host", async () => {
  if ("gpu" in navigator) {
    vi.spyOn(navigator, "gpu", "get").mockReturnValue(
      undefined as unknown as GPU,
    );
  }
  const { host } = fixture(true);
  await expect
    .poll(() => host.querySelectorAll('[role="status"]').length)
    .toBe(1);
  const status = host.querySelector<HTMLElement>('[role="status"]')!;
  expect(status.parentElement).toBe(host);
  expect(status.getBoundingClientRect().width).toBeGreaterThan(0);
  expect(status.getBoundingClientRect().height).toBeGreaterThan(0);
});

gpuIt.each(["none", "xMidYMid meet", "xMidYMid slice"])(
  "maps an offset nested viewBox with %s",
  async (preserveAspectRatio) => {
    const { host, node } = fixture(true, "100 0 160 80", preserveAspectRatio);
    await expect
      .poll(() => host.querySelector("canvas")?.dataset.chartGpu, {
        timeout: 5000,
      })
      .toBe("ready");
    const point = new DOMPoint(160, 40).matrixTransform(node.getScreenCTM()!);
    await expect
      .poll(() => compositedPixel(point.x, point.y), { timeout: 5000 })
      .toEqual([255, 0, 0, 255]);
  },
);

gpuIt("maps an offset root viewBox into the displayed viewport", async () => {
  const { host, node } = fixture(false, "100 0 160 80");
  await expect
    .poll(() => host.querySelector("canvas")?.dataset.chartGpu, {
      timeout: 5000,
    })
    .toBe("ready");
  const point = new DOMPoint(160, 40).matrixTransform(node.getScreenCTM()!);
  await expect
    .poll(() => compositedPixel(point.x, point.y), { timeout: 5000 })
    .toEqual([255, 0, 0, 255]);
});

gpuIt(
  "keeps the default identity viewBox on the standalone canvas fast path",
  async () => {
    const { host, node } = fixture(false, "0 0 160 100");
    await expect
      .poll(() => host.querySelector("canvas")?.dataset.chartGpu, {
        timeout: 5000,
      })
      .toBe("ready");
    expect(host.querySelector("foreignObject")).toBeNull();
    const point = new DOMPoint(40, 40).matrixTransform(node.getScreenCTM()!);
    await expect
      .poll(() => compositedPixel(point.x, point.y), { timeout: 5000 })
      .toEqual([255, 0, 0, 255]);
  },
);

gpuIt.each(["viewBox", "width", "height"])(
  "suppresses and restores standalone paint when %s becomes zero",
  async (attribute) => {
    const { node } = fixture(false, "0 0 160 100");
    const svg = node.ownerSVGElement!;
    const original = svg.getAttribute(attribute)!;
    const point = new DOMPoint(40, 40).matrixTransform(node.getScreenCTM()!);
    await expect
      .poll(() => compositedPixel(point.x, point.y), { timeout: 5000 })
      .toEqual([255, 0, 0, 255]);
    svg.setAttribute(attribute, attribute === "viewBox" ? "0 0 0 100" : "0");
    await expect
      .poll(() => compositedPixel(point.x, point.y), { timeout: 5000 })
      .toEqual([255, 255, 255, 255]);
    svg.setAttribute(attribute, original);
    await expect
      .poll(() => compositedPixel(point.x, point.y), { timeout: 5000 })
      .toEqual([255, 0, 0, 255]);
  },
);
