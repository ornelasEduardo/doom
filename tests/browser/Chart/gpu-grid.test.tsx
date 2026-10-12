import "../../../styles/globals.scss";

import { cleanup, render } from "@testing-library/react";
import React from "react";
import { afterEach, expect, it } from "vitest";

import { Chart } from "../../../components/Chart/Chart";
import { DesignSystemProvider } from "../../../DesignSystemProvider";

afterEach(cleanup);

it("draws grid geometry behind opaque bars without painting a second SVG grid", async () => {
  const { container } = render(
    <DesignSystemProvider>
      <Chart.Root
        data={[
          { x: "A", y: 80 },
          { x: "B", y: 60 },
        ]}
        style={{ width: 600, height: 400 }}
        type="bar"
        x="x"
        y="y"
        yDomain={[0, 100]}
      >
        <Chart.Plot>
          <Chart.Grid />
          <Chart.Series color="rgb(255, 0, 0)" type="bar" />
        </Chart.Plot>
      </Chart.Root>
    </DesignSystemProvider>,
  );
  await expect
    .poll(() => container.querySelector('[data-chart-gpu="ready"]'))
    .not.toBeNull();
  const bar = container.querySelector<SVGPathElement>(
    '[data-chart-type="bar"]',
  )!;
  const bounds = bar.getBBox();
  const grid = Array.from(
    container.querySelectorAll<SVGLineElement>("[data-chart-grid] line"),
  ).find(
    (line) =>
      line.y1.baseVal.value > bounds.y + 5 &&
      line.y1.baseVal.value < bounds.y + bounds.height - 5,
  )!;
  expect(grid.getAttribute("data-chart-gpu-mark")).toBe("path");
  expect(getComputedStyle(grid).strokeOpacity).toBe("0");
  const svg = grid.ownerSVGElement!;
  const matrix = svg.getScreenCTM()!.inverse().multiply(grid.getScreenCTM()!);
  const canvas = container.querySelector("canvas")!;
  const gl = canvas.getContext("webgl2")!;
  const at = (x: number) => {
    const point = new DOMPoint(x, grid.y1.baseVal.value).matrixTransform(
      matrix,
    );
    const ratio = canvas.width / svg.width.baseVal.value;
    const rgba = new Uint8Array(4);
    gl.readPixels(
      Math.round(point.x * ratio),
      canvas.height - 1 - Math.round(point.y * ratio),
      1,
      1,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      rgba,
    );
    return Array.from(rgba);
  };
  window.dispatchEvent(new Event("resize"));
  const pixels = await new Promise<number[][]>((resolve) =>
    requestAnimationFrame(() =>
      resolve([at(bounds.x + bounds.width / 2), at(bounds.x / 2)]),
    ),
  );
  expect(pixels[0]).toEqual([255, 0, 0, 255]);
  expect(pixels[1][3]).toBeGreaterThan(0);
  expect(pixels[1][3]).toBeLessThan(200);
});

it("keeps axis strokes behind boundary points while retaining SVG tick labels", async () => {
  const { container } = render(
    <DesignSystemProvider>
      <Chart.Root
        data={[{ x: 0, y: 50 }]}
        style={{ width: 600, height: 400 }}
        type="scatter"
        x="x"
        xDomain={[0, 100]}
        y="y"
        yDomain={[0, 100]}
      >
        <Chart.Plot>
          <Chart.Axis />
          <Chart.Series color="rgb(255, 0, 0)" type="scatter" />
        </Chart.Plot>
      </Chart.Root>
    </DesignSystemProvider>,
  );
  await expect
    .poll(() => container.querySelector('[data-chart-gpu="ready"]'))
    .not.toBeNull();
  const axis = container.querySelector<SVGPathElement>(
    '[aria-label="Y Axis"] .domain',
  )!;
  expect(axis.getAttribute("data-chart-gpu-mark")).toBe("path");
  expect(getComputedStyle(axis).strokeOpacity).toBe("0");
  expect(container.querySelectorAll(".tick text").length).toBeGreaterThan(0);
  const point = container.querySelector<SVGCircleElement>("circle")!;
  const svg = point.ownerSVGElement!;
  const position = new DOMPoint(
    point.cx.baseVal.value,
    point.cy.baseVal.value,
  ).matrixTransform(
    svg.getScreenCTM()!.inverse().multiply(point.getScreenCTM()!),
  );
  const canvas = container.querySelector("canvas")!;
  const gl = canvas.getContext("webgl2")!;
  window.dispatchEvent(new Event("resize"));
  const rgba = await new Promise<number[]>((resolve) =>
    requestAnimationFrame(() => {
      const pixel = new Uint8Array(4);
      const ratio = canvas.width / svg.width.baseVal.value;
      gl.readPixels(
        Math.round(position.x * ratio),
        canvas.height - 1 - Math.round(position.y * ratio),
        1,
        1,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        pixel,
      );
      resolve(Array.from(pixel));
    }),
  );
  expect(rgba).toEqual([255, 0, 0, 255]);
});
