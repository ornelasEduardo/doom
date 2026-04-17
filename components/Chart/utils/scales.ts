import { ScaleBand, ScaleLinear, ScalePoint, ScaleTime } from "d3-scale";

import { d3 } from "./d3";

export type ChartXScale =
  | ScaleLinear<number, number>
  | ScalePoint<string>
  | ScaleBand<string>
  | ScaleTime<number, number>;

export type ChartYScale =
  | ScaleLinear<number, number>
  | ScalePoint<string>
  | ScaleBand<string>
  | ScaleTime<number, number>;

type ChartType = "line" | "area" | "bar" | "scatter";
type Orientation = "vertical" | "horizontal";

export function createScales<T>(
  data: T[],
  width: number,
  height: number,
  margin: { top: number; right: number; bottom: number; left: number },
  x: (d: T) => string | number,
  y: (d: T) => number | string,
  type?: ChartType,
  orientation: Orientation = "vertical",
): {
  xScale: ChartXScale;
  yScale: ChartYScale;
  innerWidth: number;
  innerHeight: number;
} {
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  if (type === "bar" && orientation === "horizontal") {
    const yValues = data.map(y);
    const yScale = d3
      .scaleBand<string>()
      .domain(yValues as string[])
      .range([0, innerHeight])
      .padding(0.25);

    const xValues = data.map(x) as number[];
    const xScale = d3
      .scaleLinear()
      .domain([0, (d3.max(xValues) || 0) * 1.1])
      .nice()
      .range([0, innerWidth]);

    return { xScale, yScale, innerWidth, innerHeight };
  }

  const xValues = data.map(x);
  let xScale: ChartXScale;

  const firstValue = xValues[0];

  if (typeof firstValue === "number") {
    xScale = d3
      .scaleLinear()
      .domain(d3.extent(xValues as number[]) as [number, number])
      .range([0, innerWidth]);
  } else {
    const uniqueXValues = Array.from(new Set(xValues as string[]));
    const isDiscreteScatter =
      type === "scatter" || (type as string) === "bubble";
    xScale = d3
      .scalePoint()
      .domain(uniqueXValues)
      .range([0, innerWidth])
      .padding(isDiscreteScatter ? 0.5 : 0);
  }

  if (type === "bar") {
    xScale = d3
      .scaleBand()
      .domain(xValues as string[])
      .range([0, innerWidth])
      .padding(0.1);
  }

  const yValues = data.map(y) as number[];
  const yScale = d3
    .scaleLinear()
    .domain([0, (d3.max(yValues) || 0) * 1.1])
    .nice()
    .range([innerHeight, 0]);

  return { xScale, yScale, innerWidth, innerHeight };
}
