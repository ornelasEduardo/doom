import { afterEach, expect, it, vi } from "vitest";

import { registerGpuMark } from "../../../components/Chart/rendering/scene";
import { compositedPixel } from "./composited-pixel";
import { hasWebGpu } from "./webgpu-readback";

const gpuIt = it.skipIf(!(await hasWebGpu()));
const cleanup: (() => void)[] = [];
afterEach(() => {
  cleanup
    .splice(0)
    .reverse()
    .forEach((dispose) => dispose());
  vi.restoreAllMocks();
});

function fixture(content: string) {
  const host = document.createElement("div");
  host.style.cssText =
    "position:relative;width:160px;height:100px;background:white";
  host.innerHTML = `<svg width="160" height="100">${content}</svg>`;
  document.body.append(host);
  cleanup.push(() => host.remove());
  const svg = host.querySelector("svg")!;
  for (const node of svg.querySelectorAll<SVGCircleElement>(
    "[data-chart-gpu-mark]",
  )) {
    cleanup.push(
      registerGpuMark(node, {
        kind: "point",
        x: node.cx.baseVal.value,
        y: node.cy.baseVal.value,
        radius: node.r.baseVal.value,
      }),
    );
  }
  const pixel = async (x: number, y: number) => {
    const point = new DOMPoint(x, y).matrixTransform(svg.getScreenCTM()!);
    return compositedPixel(point.x, point.y);
  };
  const ready = () =>
    expect
      .poll(
        () => {
          const canvases = [...host.querySelectorAll("canvas")];
          return (
            canvases.length > 0 &&
            canvases.every((canvas) => canvas.dataset.chartGpu === "ready")
          );
        },
        { timeout: 5000 },
      )
      .toBe(true);
  return { host, svg, pixel, ready };
}

gpuIt(
  "preserves custom SVG background, interleaved paint, and foreground order",
  async () => {
    const { host, svg, pixel, ready } = fixture(`
    <rect width="160" height="100" fill="white" />
    <circle data-chart-gpu-mark="point" cx="15" cy="40" r="10" fill="red" />
    <circle data-chart-gpu-mark="point" cx="40" cy="40" r="10" fill="red" />
    <rect x="30" y="20" width="90" height="40" fill="lime" />
    <circle data-chart-gpu-mark="point" cx="70" cy="40" r="10" fill="blue" />
    <circle data-chart-gpu-mark="point" cx="100" cy="40" r="10" fill="blue" />
    <rect x="90" y="20" width="20" height="40" fill="black" />
  `);
    await ready();
    await expect
      .poll(() => pixel(15, 40), { timeout: 5000 })
      .toEqual([255, 0, 0, 255]);
    await expect
      .poll(() => pixel(40, 40), { timeout: 5000 })
      .toEqual([0, 255, 0, 255]);
    await expect
      .poll(() => pixel(70, 40), { timeout: 5000 })
      .toEqual([0, 0, 255, 255]);
    await expect
      .poll(() => pixel(100, 40), { timeout: 5000 })
      .toEqual([0, 0, 0, 255]);

    // Removing custom paint restores the batched scene without stale layers.
    svg.querySelectorAll("rect").forEach((node) => node.remove());
    await expect.poll(() => host.querySelectorAll("canvas").length).toBe(1);
    await ready();
    await expect
      .poll(() => pixel(40, 40), { timeout: 5000 })
      .toEqual([255, 0, 0, 255]);
    await expect
      .poll(() => pixel(100, 40), { timeout: 5000 })
      .toEqual([0, 0, 255, 255]);
  },
);

gpuIt(
  "preserves native paint order when an ancestor theme class changes",
  async () => {
    const { host, pixel, ready } = fixture(`
    <style>.mixed-hidden .native-background { fill: transparent; }</style>
    <rect class="native-background" width="160" height="100" fill="lime" />
    <circle data-chart-gpu-mark="point" cx="40" cy="40" r="10" fill="red" />
  `);
    host.className = "mixed-hidden";
    await ready();
    await expect
      .poll(() => pixel(40, 40), { timeout: 5000 })
      .toEqual([255, 0, 0, 255]);
    await expect
      .poll(() => pixel(80, 40), { timeout: 5000 })
      .toEqual([255, 255, 255, 255]);
    host.className = "";
    await expect
      .poll(() => host.querySelector("canvas")?.closest("foreignObject"))
      .not.toBeNull();
    await ready();
    await expect
      .poll(() => pixel(40, 40), { timeout: 5000 })
      .toEqual([255, 0, 0, 255]);
    await expect
      .poll(() => pixel(80, 40), { timeout: 5000 })
      .toEqual([0, 255, 0, 255]);
  },
);

it("announces unavailable rendering once for a chart with multiple GPU layers", async () => {
  if ("gpu" in navigator) {
    vi.spyOn(navigator, "gpu", "get").mockReturnValue(
      undefined as unknown as GPU,
    );
  }
  const { host } = fixture(`
    <circle data-chart-gpu-mark="point" cx="30" cy="40" r="10" fill="red" />
    <rect x="10" y="10" width="100" height="60" fill="lime" />
    <circle data-chart-gpu-mark="point" cx="60" cy="40" r="10" fill="blue" />
  `);
  await expect
    .poll(() => host.querySelectorAll('[data-chart-gpu="unavailable"]').length)
    .toBe(2);
  expect(host.querySelectorAll('[role="status"]')).toHaveLength(1);
  expect(host.querySelector('[role="status"]')?.textContent).toContain(
    "GPU rendering is unavailable",
  );
});

gpuIt.each([false, true])(
  "preserves transformed mixed SVG paint with opacity enabled: %s",
  async (translucent) => {
    const { host, pixel, ready } = fixture(`
    <g transform="translate(20 10) scale(1.5)" opacity="${translucent ? 0.5 : 1}">
      <rect width="60" height="40" fill="lime" />
      <circle data-chart-gpu-mark="point" cx="20" cy="20" r="8" fill="red" />
    </g>
  `);
    await ready();
    await expect
      .poll(
        async () => {
          const [r, g, b, a] = await pixel(50, 40);
          return (
            r === 255 &&
            a === 255 &&
            g === b &&
            (translucent ? g >= 127 && g <= 128 : g === 0)
          );
        },
        { timeout: 5000 },
      )
      .toBe(true);
    expect(host.querySelector("feImage")).not.toBeNull();
  },
);

gpuIt(
  "keeps native transformed group opacity, clipping, and object bounds",
  async () => {
    const { svg, pixel, ready } = fixture(`
    <defs><clipPath id="mixed-clip" clipPathUnits="objectBoundingBox"><rect width="0.75" height="1" /></clipPath></defs>
    <g id="mixed-group" transform="translate(20 10) scale(1.5)" opacity="0.5" clip-path="url(#mixed-clip)">
      <rect width="60" height="40" fill="lime" />
      <circle data-chart-gpu-mark="point" cx="20" cy="20" r="8" fill="red" />
      <rect x="30" y="10" width="10" height="20" fill="blue" />
      <circle data-chart-gpu-mark="point" cx="50" cy="20" r="8" fill="red" />
    </g>
  `);
    await ready();
    const box = svg.querySelector<SVGGElement>("#mixed-group")!.getBBox();
    expect([box.x, box.y, box.width, box.height]).toEqual([0, 0, 60, 40]);
    await expect
      .poll(async () => (await pixel(50, 40))[0], { timeout: 5000 })
      .toBe(255);
    const point = await pixel(50, 40);
    expect(point[0]).toBe(255);
    expect(point[1]).toBeGreaterThanOrEqual(127);
    expect(point[1]).toBeLessThanOrEqual(128);
    expect(point[2]).toBe(point[1]);
    await expect
      .poll(() => pixel(95, 40), { timeout: 5000 })
      .toEqual([255, 255, 255, 255]);

    // Generated layers must not retain a stale, larger bounding box when
    // consumer-owned geometry shrinks after initialization.
    svg
      .querySelector<SVGRectElement>("#mixed-group > rect")!
      .setAttribute("width", "20");
    await expect
      .poll(
        () => svg.querySelector<SVGGElement>("#mixed-group")!.getBBox().width,
      )
      .toBe(58);
  },
);

gpuIt.each(["clip", "mask", "mask-content", "filter"] as const)(
  "preserves degenerate %s object bounds until native geometry expands them",
  async (effect) => {
    const definitions = {
      clip: '<clipPath id="mixed-flat-effect" clipPathUnits="objectBoundingBox"><rect width="1" height="1" /></clipPath>',
      mask: '<mask id="mixed-flat-effect"><rect width="160" height="100" fill="white" /></mask>',
      "mask-content":
        '<mask id="mixed-flat-effect" maskUnits="userSpaceOnUse" maskContentUnits="objectBoundingBox" x="0" y="0" width="160" height="100"><rect width="1" height="1" fill="white" /></mask>',
      filter:
        '<filter id="mixed-flat-effect"><feOffset dx="0" dy="0" /></filter>',
    };
    const attribute =
      effect === "clip"
        ? "clip-path"
        : effect === "mask-content"
          ? "mask"
          : effect;
    const { host, svg, pixel, ready } = fixture(`
    <defs>${definitions[effect]}</defs>
    <g id="mixed-flat-group" ${attribute}="url(#mixed-flat-effect)">
      <line x1="10" y1="40" x2="130" y2="40" stroke="blue" stroke-width="10" />
      <path d="M10 40 L130 40" fill="none" stroke="red" stroke-width="10" />
    </g>
  `);
    const group = svg.querySelector<SVGGElement>("#mixed-flat-group")!;
    expect(group.getBBox().height).toBe(0);
    const nativePixel = await pixel(40, 40);
    expect(nativePixel).toEqual([255, 255, 255, 255]);
    const path = group.querySelector("path")!;
    path.setAttribute("data-chart-gpu-mark", "path");
    cleanup.push(
      registerGpuMark(path, {
        kind: "path",
        contours: [
          {
            closed: false,
            points: [
              { x: 10, y: 40 },
              { x: 130, y: 40 },
            ],
          },
        ],
      }),
    );
    await expect
      .poll(() => host.querySelectorAll("foreignObject").length)
      .toBe(1);
    await ready();
    expect(group.getBBox().height).toBe(0);
    await expect
      .poll(() => pixel(40, 40), { timeout: 5000 })
      .toEqual(nativePixel);

    group.querySelector("line")!.setAttribute("y2", "50");
    await expect.poll(() => group.getBBox().height).toBe(10);
    await expect
      .poll(() => pixel(40, 42), { timeout: 5000 })
      .toEqual([255, 0, 0, 255]);
  },
);

gpuIt(
  "preserves zero-bounds filter primitive coordinates through transforms and scrolling",
  async () => {
    const { host, svg, ready } = fixture(`
    <defs><filter id="mixed-flat-primitives" filterUnits="userSpaceOnUse" primitiveUnits="objectBoundingBox" x="0" y="0" width="160" height="100"><feOffset dx="0" dy="20" /></filter></defs>
    <g transform="translate(20 10) rotate(15) scale(1.1)" filter="url(#mixed-flat-primitives)">
      <line x1="10" y1="40" x2="130" y2="40" stroke="blue" stroke-width="10" />
      <path d="M10 40 L130 40" fill="none" stroke="red" stroke-width="10" />
    </g>
  `);
    const previousHeight = document.body.style.minHeight;
    const previousScroll = window.scrollY;
    document.body.style.minHeight = "2000px";
    host.style.marginTop = "300px";
    cleanup.push(() => {
      document.body.style.minHeight = previousHeight;
      window.scrollTo(0, previousScroll);
    });
    const path = svg.querySelector("path")!;
    const group = path.parentElement as unknown as SVGGElement;
    const sample = () => {
      const point = new DOMPoint(40, 40).matrixTransform(path.getScreenCTM()!);
      return compositedPixel(point.x, point.y);
    };
    const nativePixel = await sample();
    expect(nativePixel).toEqual([255, 0, 0, 255]);
    path.setAttribute("data-chart-gpu-mark", "path");
    cleanup.push(
      registerGpuMark(path, {
        kind: "path",
        contours: [
          {
            closed: false,
            points: [
              { x: 10, y: 40 },
              { x: 130, y: 40 },
            ],
          },
        ],
      }),
    );
    await ready();
    expect(group.getBBox().height).toBe(0);
    await expect.poll(sample).toEqual(nativePixel);
    window.scrollTo(0, 150);
    await expect.poll(() => window.scrollY).toBe(150);
    expect(group.getBBox().height).toBe(0);
    await expect.poll(sample).toEqual(nativePixel);
  },
);
