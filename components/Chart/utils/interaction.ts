import { d3 } from "./d3";
import { ChartXScale } from "./scales";

/**
 * Finds the nearest data point to a given X coordinate.
 */
export function findNearestDataPoint<T>(
  pointerX: number,
  data: T[],
  xScale: ChartXScale,
  xAccessor: (d: T) => string | number,
): T | null {
  if ("invert" in xScale && typeof xScale.invert === "function") {
    // Linear or time scale (continuous) - use bisector
    const x0 = xScale.invert(pointerX);
    // For bisector, we need a numeric comparator
    const bisect = d3.bisector<T, number>((d) => {
      const val = xAccessor(d);
      return typeof val === "number" ? val : 0;
    }).left;
    // Convert x0 to number for comparison (handles Date by using getTime if needed)
    const x0Num = typeof x0 === "number" ? x0 : (x0 as Date).getTime();
    const i = bisect(data, x0Num, 1);
    const d0 = data[i - 1];
    const d1 = data[i];

    if (!d0) {
      return d1;
    }
    if (!d1) {
      return d0;
    }

    const d0Dist = Math.abs((x0 as number) - (xAccessor(d0) as number));
    const d1Dist = Math.abs((xAccessor(d1) as number) - (x0 as number));
    return d0Dist > d1Dist ? d1 : d0;
  } else if ("bandwidth" in xScale && typeof xScale.bandwidth === "function") {
    // Band scale (categorical) - find closest band center
    let closestDist = Infinity;
    let closestData: T | null = null;

    // TODO: Optimize this for large datasets (currently O(N))
    // We could pre-calculate band centers or use scale.step() to estimate index
    for (const d of data) {
      const bandCenter =
        (xScale as (val: string | number) => number)(xAccessor(d)) +
        xScale.bandwidth() / 2;
      const dist = Math.abs(pointerX - bandCenter);
      if (dist < closestDist) {
        closestDist = dist;
        closestData = d;
      }
    }
    return closestData;
  } else if ("step" in xScale) {
    // Point scale (categorical)
    const domain = xScale.domain();
    const range = xScale.range();
    const step = xScale.step();
    // Estimate index based on range?
    // Point scales are evenly spaced.
    // range[0] is start, step is distance.
    // pointerX approx index * step + range[0]
    // let's stick to the simple iteration for now for correctness with Point scales which can be weird
    let closestDist = Infinity;
    let closestData: T | null = null;

    for (const d of data) {
      const xPos = (xScale as (val: string | number) => number)(xAccessor(d));
      const dist = Math.abs(pointerX - xPos);
      if (dist < closestDist) {
        closestDist = dist;
        closestData = d;
      }
    }
    return closestData;
  }

  return null;
}
