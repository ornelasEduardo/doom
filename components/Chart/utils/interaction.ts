import { ChartXScale, ChartYScale } from "./scales";

/**
 * Finds the nearest data point to a given (x, y) coordinate using Euclidean distance.
 * Best for scatter plots or 2D visualization where Y proximity matters.
 */
export function findNearestPoint2D<T>(
  pointerX: number,
  pointerY: number,
  data: T[],
  xScale: ChartXScale,
  yScale: ChartYScale,
  xAccessor: (d: T) => string | number,
  yAccessor: (d: T) => number,
): T | null {
  let closestDist = Infinity;
  let closestData: T | null = null;

  for (const d of data) {
    const valX = xAccessor(d);
    const valY = yAccessor(d);

    let xPos: number;
    if ("bandwidth" in xScale) {
      xPos = (xScale as any)(valX) + xScale.bandwidth() / 2;
    } else {
      xPos = (xScale as any)(valX) || 0;
    }

    const yPos = yScale(valY);

    if (xPos === undefined || yPos === undefined) {
      continue;
    }

    const dx = pointerX - xPos;
    const dy = pointerY - yPos;
    const distSq = dx * dx + dy * dy;

    if (distSq < closestDist) {
      closestDist = distSq;
      closestData = d;
    }
  }

  return closestData;
}

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
    let closestDist = Infinity;
    let closestData: T | null = null;
    const x0 = xScale.invert(pointerX);
    const targetVal = typeof x0 === "number" ? x0 : (x0 as Date).getTime();

    for (const d of data) {
      const val = xAccessor(d);
      if (val === undefined || val === null) {
        continue;
      }

      const currentVal =
        typeof val === "number" ? val : new Date(val).getTime();
      const dist = Math.abs(currentVal - targetVal);

      if (dist < closestDist) {
        closestDist = dist;
        closestData = d;
      }
    }
    return closestData;
  } else if ("bandwidth" in xScale && typeof xScale.bandwidth === "function") {
    // Band scale (categorical) - find closest band center
    let closestDist = Infinity;
    let closestData: T | null = null;

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
