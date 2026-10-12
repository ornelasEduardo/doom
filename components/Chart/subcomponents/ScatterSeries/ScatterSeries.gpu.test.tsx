import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { ChartContext } from "../../context";
import { CHART_DATA_ATTRS } from "../../engine";
import type { GpuMark } from "../../rendering/scene";
import { createChartStore } from "../../state/store/chart.store";
import type { ContextValue } from "../../types";
import { d3 } from "../../utils/d3";
import { ScatterSeries } from "./ScatterSeries";

const registered = vi.hoisted(() => [] as GpuMark[]);
// The scene owns WebGL. Exercise the real component's immutable buffer inputs.
vi.mock("../../rendering/scene", () => ({
  registerGpuMark: (_node: SVGGraphicsElement, mark: GpuMark) => {
    registered.push(mark);
    return () => {};
  },
}));
type Row = { x: number; y: number | null; size: number };
beforeEach(() => {
  registered.length = 0;
});
afterEach(cleanup);
function draw(data: Row[]) {
  const chartStore = createChartStore(
    {
      width: 100,
      height: 100,
      margin: { top: 0, left: 0, right: 0, bottom: 0 },
    },
    "x",
    "y",
  );
  chartStore.setState({
    data,
    scales: {
      x: d3.scaleLinear().domain([0, 100]).range([0, 100]),
      y: d3.scaleLinear().domain([0, 100]).range([0, 100]),
    },
  });
  return render(
    <ChartContext.Provider
      value={{ chartStore, config: {}, x: "x", y: "y" } as ContextValue<Row>}
    >
      <svg>
        <ScatterSeries<Row> size="size" />
      </svg>
    </ChartContext.Provider>,
  );
}
it("compacts invalid rows only in GPU buffers and retains valid point sizing", () => {
  const data = Array.from(
    { length: 1001 },
    (): Row => ({ x: 0, y: null, size: 0 }),
  );
  data[3] = { x: 10, y: 20, size: 0 };
  data[500] = { x: 50, y: 30, size: 4 };
  data[1000] = { x: 90, y: 80, size: -1 };
  const { container } = draw(data);
  const mark = registered.find((mark) => mark.kind === "cloud");
  expect(mark?.kind).toBe("cloud");
  if (mark?.kind !== "cloud") {
    throw new Error("Expected cloud buffers");
  }
  expect([...mark.positions]).toEqual([10, 20, 50, 30, 90, 80]);
  expect([...mark.radii]).toEqual([4, 20, 6]);
  expect(mark.dataIndices).toEqual(new Int32Array([3, 500, 1000]));
  expect(mark.dataAt?.(0)).toBe(data[3]);
  expect(mark.dataAt?.(1)).toBe(data[500]);
  expect(mark.dataAt?.(2)).toBe(data[1000]);
  expect(mark.dataAt?.(3)).toBeUndefined();
  const group = container.querySelector('[data-chart-gpu-mark="cloud"]')!;
  expect(mark.seriesId).toBe(group.getAttribute(CHART_DATA_ATTRS.SERIES_ID));
  const proxies = group.querySelectorAll("circle");
  expect(proxies).toHaveLength(1);
  expect(proxies[0].hasAttribute("data-chart-gpu-selector-proxy")).toBe(true);
  expect(proxies[0].getAttribute("r")).toBe("0");
  expect(proxies[0].hasAttribute(CHART_DATA_ATTRS.INDEX)).toBe(false);
  expect(
    container
      .querySelector('[data-chart-gpu-mark="cloud"]')
      ?.getAttribute("aria-label"),
  ).toContain("3 data points");
});
it("sizes hundreds of thousands of rows without spreading values onto the call stack", () => {
  const data = Array.from({ length: 200000 }, (_, index) => ({
    x: index % 100,
    y: index % 100,
    size: index === 199999 ? 16 : 4,
  }));
  draw(data);
  const mark = registered.find((mark) => mark.kind === "cloud");
  expect(mark?.kind).toBe("cloud");
  if (mark?.kind !== "cloud") {
    throw new Error("Expected cloud buffers");
  }
  expect(mark.radii.length).toBe(200000);
  expect(mark.radii[0]).toBe(12);
  expect(mark.radii[199999]).toBe(20);
});
