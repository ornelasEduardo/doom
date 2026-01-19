import { ScaleBand, ScaleLinear, ScalePoint, ScaleTime } from "d3-scale";

import { d3 } from "./d3";

export type ChartXScale =
  | ScaleLinear<number, number>
  | ScalePoint<string>
  | ScaleBand<string>
  | ScaleTime<number, number>;

export type ChartYScale = ScaleLinear<number, number>;

/**
 * Creates X and Y scales based on data and chart dimensions.
 */
export function createScales<T>(
  data: T[],
  width: number,
  height: number,
  margin: { top: number; right: number; bottom: number; left: number },
  x: (d: T) => string | number,
  y: (d: T) => number,
  type?: "line" | "area" | "bar" | "scatter",
): {
  xScale: ChartXScale;
  yScale: ChartYScale;
  innerWidth: number;
  innerHeight: number;
} {
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const xValues = data.map(x);
  let xScale: ChartXScale;

  // Check first value type to determine scale type
  const firstValue = xValues[0];

  if (typeof firstValue === "number") {
    // Numeric scale - use linear
    xScale = d3
      .scaleLinear()
      .domain(d3.extent(xValues as number[]) as [number, number])
      .range([0, innerWidth]);
  } else {
    // String/categorical data - use point scale
    const uniqueXValues = Array.from(new Set(xValues as string[]));
    xScale = d3
      .scalePoint()
      .domain(uniqueXValues)
      .range([0, innerWidth])
      .padding(0);
  }

  if (type === "bar") {
    xScale = d3
      .scaleBand()
      .domain(xValues as string[])
      .range([0, innerWidth])
      .padding(0.1);
  }

  const yValues = data.map(y);
  const yScale = d3
    .scaleLinear()
    .domain([0, (d3.max(yValues) || 0) * 1.1])
    .nice()
    .range([innerHeight, 0]);

  return { xScale, yScale, innerWidth, innerHeight };
}
