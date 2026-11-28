import "../../../styles/globals.scss";

import { cleanup, render } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { commands } from "vitest/browser";

import { Chart } from "../../../components/Chart/Chart";
import { registerGpuMark } from "../../../components/Chart/rendering/scene";
import { DesignSystemProvider } from "../../../DesignSystemProvider";
import { compositedPixel } from "./composited-pixel";
import { hasWebGpu } from "./webgpu-readback";

const gpuIt = it.skipIf(!(await hasWebGpu()));
afterEach(cleanup);

gpuIt(
  "preserves themed bar hover brightness and restores its original paint",
  async () => {
    const view = render(
      <DesignSystemProvider initialTheme="doom">
        <Chart.Root
          data={[
            { x: 0, y: 5 },
            { x: 1, y: 10 },
          ]}
          style={{ width: 600, height: 400 }}
          type="bar"
          x="x"
          y="y"
        >
          <Chart.Plot>
            <Chart.Series color="rgb(100, 100, 100)" type="bar" />
          </Chart.Plot>
        </Chart.Root>
      </DesignSystemProvider>,
    );
    await expect
      .poll(() =>
        view.container
          .querySelector("[data-chart-gpu]")
          ?.getAttribute("data-chart-gpu"),
      )
      .toBe("ready");
    const bar = view.container.querySelector<SVGPathElement>(
      '[data-chart-type="bar"]',
    )!;
    const box = bar.getBoundingClientRect();
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    const pixel = async (hover: boolean, filter: string) => {
      // Headed screenshot capture can reset native hover. Establish the real
      // pointer state for each sample, then verify both CSS and rendered paint.
      await commands.moveChartPointer(hover ? x : 1, hover ? y : 1);
      expect(bar.matches(":hover")).toBe(hover);
      expect(
        getComputedStyle(bar)
          .getPropertyValue("--chart-gpu-color-filter")
          .trim(),
      ).toBe(filter);
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      return compositedPixel(x, y);
    };
    await expect.poll(() => pixel(false, "none")).toEqual([100, 100, 100, 255]);
    await expect
      .poll(() => pixel(true, "brightness(1.1)"))
      .toEqual([110, 110, 110, 255]);
    await expect.poll(() => pixel(false, "none")).toEqual([100, 100, 100, 255]);
    bar.style.setProperty("--control-hover-filter", "none");
    await expect.poll(() => pixel(true, "none")).toEqual([100, 100, 100, 255]);
  },
);

gpuIt(
  "paints translucent GPU marks once without semantic SVG overdraw",
  async () => {
    const host = document.createElement("div");
    host.style.cssText =
      "position:relative;width:100px;height:100px;background:white";
    host.innerHTML =
      '<svg width="100" height="100"><circle data-chart-gpu-mark="point" cx="50" cy="50" r="20" fill="rgb(100,100,100)" fill-opacity="0.5" /></svg>';
    document.body.append(host);
    const node = host.querySelector<SVGCircleElement>("circle")!;
    const release = registerGpuMark(node, {
      kind: "point",
      x: 50,
      y: 50,
      radius: 20,
    });
    try {
      await expect
        .poll(() => host.querySelector("canvas")?.dataset.chartGpu)
        .toBe("ready");
      const box = node.getBoundingClientRect();
      await expect
        .poll(async () => {
          const pixel = await compositedPixel(
            box.left + box.width / 2,
            box.top + box.height / 2,
          );
          return (
            pixel[3] === 255 &&
            pixel.slice(0, 3).every((value) => value >= 177 && value <= 178)
          );
        })
        .toBe(true);
    } finally {
      release();
      host.remove();
    }
  },
);
