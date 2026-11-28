import { act, cleanup, render } from "@testing-library/react";
import type { SVGProps } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { ChartContext } from "../../context";
import { CHART_DATA_ATTRS } from "../../engine";
import type { VectorContour } from "../../rendering/vector-path";
import { createChartStore } from "../../state/store/chart.store";
import type { ContextValue } from "../../types";
import { d3 } from "../../utils/d3";
import { BarSeries } from "./BarSeries";

type Mark = SVGProps<SVGPathElement> & { contours: VectorContour[] };
const marks = vi.hoisted(() => [] as Mark[]);
// Inspect computed renderer inputs while forwarding the real semantic SVG ref.
vi.mock("../../rendering/GpuPath", () => ({
  GpuPath: ({ contours, ...props }: Mark) => {
    marks.push({ contours, ...props });
    return <path {...props} />;
  },
}));

beforeEach(() => {
  marks.length = 0;
});
afterEach(cleanup);

type Row = { category: string; value: number };
it.each(["vertical", "horizontal"] as const)(
  "publishes signed %s bar contours with datum refs and hit metadata",
  (orientation) => {
    const data: Row[] = [
      { category: "A", value: 10 },
      { category: "B", value: -10 },
    ];
    const horizontal = orientation === "horizontal";
    const x = horizontal ? "value" : "category";
    const y = horizontal ? "category" : "value";
    const chartStore = createChartStore(
      {
        width: 100,
        height: 100,
        margin: { top: 0, left: 0, right: 0, bottom: 0 },
      },
      x,
      y,
    );
    const category = d3
      .scaleBand<string | number>()
      .domain(["A", "B"])
      .range([0, 100]);
    const value = d3
      .scaleLinear()
      .domain([-10, 10])
      .range(horizontal ? [0, 100] : [100, 0]);
    chartStore.setState({
      data,
      scales: {
        x: horizontal ? value : category,
        y: horizontal ? category : value,
      },
    });
    const { container } = render(
      <ChartContext.Provider
        value={{ chartStore, config: {}, x, y } as ContextValue<Row>}
      >
        <svg>
          <BarSeries
            barWidth={20}
            color="red"
            label="Revenue"
            orientation={orientation}
          />
        </svg>
      </ChartContext.Provider>,
    );
    // Registration recomputes domains; pin output coordinates after that effect.
    marks.length = 0;
    act(() =>
      chartStore.setState({
        scales: {
          x: horizontal ? value.copy() : category.copy(),
          y: horizontal ? category.copy() : value.copy(),
        },
      }),
    );
    expect(marks.length).toBeGreaterThan(0);
    const bars = container.querySelectorAll<
      SVGPathElement & { __data__?: Row }
    >("path");
    expect(bars).toHaveLength(2);
    bars.forEach((bar, index) => {
      expect(bar.__data__).toBe(data[index]);
      expect(bar).toHaveAttribute(CHART_DATA_ATTRS.TYPE, "bar");
      expect(bar).toHaveAttribute(CHART_DATA_ATTRS.INDEX, String(index));
      expect(bar).toHaveAttribute("aria-roledescription", "bar");
      expect(bar.getAttribute("d")).toContain("A");
    });
    const contours = marks.slice(-2).map((mark) => mark.contours[0]);
    for (const contour of contours) {
      expect(contour.closed).toBe(true);
      expect(contour.points.length).toBeGreaterThan(4);
    }
    expect(
      contours.map((contour) => {
        const xs = contour.points.map((point) => point.x);
        const ys = contour.points.map((point) => point.y);
        return [
          Math.min(...xs),
          Math.min(...ys),
          Math.max(...xs),
          Math.max(...ys),
        ];
      }),
    ).toEqual(
      horizontal
        ? [
            [50, 15, 100, 35],
            [0, 65, 50, 85],
          ]
        : [
            [15, 0, 35, 50],
            [65, 50, 85, 100],
          ],
    );
  },
);
