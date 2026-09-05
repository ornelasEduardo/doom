import { ScaleBand, ScaleLinear, ScalePoint, ScaleTime } from "d3-scale";

import { AxisDomain } from "../types/props";
import { Scale } from "../types/scales";
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
    xScale = d3
      .scaleLinear()
      .domain(numericExtent(xValues as number[]))
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

  const yValues = data.map(y);
  const yScale = d3
    .scaleLinear()
    .domain(automaticYDomain(yValues))
    .nice()
    .range([innerHeight, 0]);

  return { xScale, yScale, innerWidth, innerHeight };
}

/** Tick budget shared by the Y axis and the grid, so the two cannot drift. */
export const yTickCount = (isMobile?: boolean) => (isMobile ? 3 : 5);

export function automaticYDomain(values: number[]): [number, number] {
  const finite = values.filter(Number.isFinite);
  const min = Math.min(0, d3.min(finite) ?? 0);
  const max = Math.max(0, d3.max(finite) ?? 0);
  return [min * 1.1, max * 1.1 || (min < 0 ? 0 : 1)];
}

function numericExtent(values: number[]): [number, number] {
  const finite = values.filter(Number.isFinite);
  const min = d3.min(finite) ?? 0;
  const max = d3.max(finite) ?? 1;
  return min === max ? [min - 1, max + 1] : [min, max];
}

export function resolveDomain(
  automatic: number[],
  bounds?: AxisDomain,
): number[] {
  if (
    !bounds ||
    bounds.some((value) => value !== null && !Number.isFinite(value))
  ) {
    return automatic;
  }
  const [lower, upper] = bounds;
  if (lower !== null && upper !== null && lower >= upper) {
    return automatic;
  }
  let min = lower ?? automatic[0];
  let max = upper ?? automatic[1];
  if (min >= max) {
    if (lower !== null) {
      max = min + Math.max(1, Math.abs(min) * 0.1);
    } else {
      min = max - Math.max(1, Math.abs(max) * 0.1);
    }
  }
  return [min, max];
}

export function hasDomainOverride(
  scale: Scale | null,
  bounds?: AxisDomain,
): boolean {
  return (
    !!scale &&
    "invert" in scale &&
    !!bounds &&
    bounds.some((value) => value !== null) &&
    bounds.every((value) => value === null || Number.isFinite(value)) &&
    (bounds[0] === null || bounds[1] === null || bounds[0] < bounds[1])
  );
}
