import { cleanup, render } from "@testing-library/react";
import type { SVGProps } from "react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

import { ChartContext } from "../../context";
import type { VectorContour } from "../../rendering/vector-path";
import { createChartStore } from "../../state/store/chart.store";
import type { ContextValue } from "../../types";
import { d3 } from "../../utils/d3";
import { LineSeries } from "./LineSeries";

type Mark = SVGProps<SVGPathElement> & {
  contours: VectorContour[];
  gradient?: { startOpacity: number; endOpacity: number };
};
const marks = vi.hoisted(() => [] as Mark[]);
// Capture the renderer boundary; actual GPU drawing belongs to browser tests.
vi.mock("../../rendering/GpuPath", () => ({
  GpuPath: ({ contours, gradient, ...props }: Mark) => {
    marks.push({ contours, gradient, ...props });
    return <path {...props} />;
  },
}));

type Row = { x: number; y: number | null };
beforeEach(() => {
  marks.length = 0;
});
afterEach(cleanup);

function draw(
  data: Row[],
  options: {
    type?: "line" | "area";
    withGradient?: boolean;
    curve?: typeof d3.curveLinear;
  } = {},
) {
  const chartStore = createChartStore(
    {
      width: 100,
      height: 100,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    },
    "x",
    "y",
  );
  chartStore.setState({
    data,
    scales: {
      x: d3.scaleLinear().domain([0, 4]).range([0, 100]),
      y: d3.scaleLinear().domain([0, 20]).range([100, 0]),
    },
  });
  return render(
    <ChartContext.Provider
      value={
        {
          chartStore,
          config: { withGradient: options.withGradient },
          x: "x",
          y: "y",
        } as ContextValue<Row>
      }
    >
      <svg>
        <LineSeries
          color="red"
          curve={options.curve}
          label="Revenue"
          type={options.type}
        />
      </svg>
    </ChartContext.Provider>,
  );
}

it("publishes separate line contours across missing samples and retains semantic paths", () => {
  const { container } = draw([
    { x: 0, y: 10 },
    { x: 1, y: 20 },
    { x: 2, y: null },
    { x: 3, y: 0 },
    { x: 4, y: 10 },
  ]);
  const line = marks.find((mark) => mark["aria-roledescription"] === "line");
  expect(line?.contours).toEqual([
    {
      points: [
        { x: 0, y: 50 },
        { x: 25, y: 0 },
      ],
      closed: false,
    },
    {
      points: [
        { x: 75, y: 100 },
        { x: 100, y: 50 },
      ],
      closed: false,
    },
  ]);
  expect(container.querySelector('[aria-label="Revenue"]')).toHaveAttribute(
    "d",
    "M0,50L25,0M75,100L100,50",
  );
  expect(line?.style?.stroke).toBe("red");
});

it("publishes closed area contours with explicit color and GPU gradient opacity", () => {
  draw(
    [
      { x: 0, y: 10 },
      { x: 4, y: 20 },
    ],
    { type: "area" },
  );
  const area = marks.find((mark) => mark.gradient);
  expect(area?.gradient).toEqual({ startOpacity: 0.4, endOpacity: 0 });
  expect(area?.style?.fill).toBe("red");
  expect(area?.d).toBe("M0,50L100,0L100,100L0,100Z");
  expect(area?.contours[0].closed).toBe(true);
  expect(area?.contours[0].points).toEqual(
    expect.arrayContaining([
      { x: 0, y: 50 },
      { x: 100, y: 0 },
      { x: 100, y: 100 },
      { x: 0, y: 100 },
    ]),
  );
});

it("keeps area absent when gradients are disabled", () => {
  draw(
    [
      { x: 0, y: 10 },
      { x: 4, y: 20 },
    ],
    { type: "area", withGradient: false },
  );
  expect(marks.length).toBeGreaterThan(0);
  expect(
    marks.every(
      (mark) => mark["aria-roledescription"] === "line" && !mark.gradient,
    ),
  ).toBe(true);
});

it("collects curved D3 geometry without replacing the semantic cubic path", () => {
  draw(
    [
      { x: 0, y: 10 },
      { x: 2, y: 20 },
      { x: 4, y: 0 },
    ],
    { curve: d3.curveBasis },
  );
  const line = marks.find((mark) => mark["aria-roledescription"] === "line");
  expect(line?.d).toContain("C");
  expect(line?.contours[0].points.length).toBeGreaterThan(5);
  expect(line?.contours[0].points[0]).toEqual({ x: 0, y: 50 });
  expect(line?.contours[0].points.at(-1)).toEqual({ x: 100, y: 100 });
});
