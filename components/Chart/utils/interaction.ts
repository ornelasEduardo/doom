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
    let closestData: T | null = null;
    let minDiff = Infinity;

    // Use linear scan with PIXEL distance to ensure visual accuracy
    // and support unsorted data.
    for (const d of data) {
      const val = xAccessor(d);
      if (val === undefined || val === null) {
        continue;
      }

      const pixelPos = (xScale as any)(val);
      if (typeof pixelPos !== "number") {
        continue;
      }

      const diff = Math.abs(pointerX - pixelPos);

      // Use <= to favor the right-most point in case of ties (optional, but standardizes behavior)
      // or < to favor left-most.
      // D3 usually favors the closest.
      if (diff < minDiff) {
        minDiff = diff;
        closestData = d;
      }
    }
    return closestData;
  } else if (
    "bandwidth" in xScale &&
    typeof xScale.bandwidth === "function" &&
    xScale.bandwidth() > 0
  ) {
    // Band scale (categorical) - find closest band center
    let closestDist = Infinity;
    let closestData: T | null = null;

    for (const d of data) {
      const start = (xScale as (val: string | number) => number)(xAccessor(d));
      const bandwidth = xScale.bandwidth();
      const end = start + bandwidth;

      // Hitbox check: if inside band, distance is effectively 0
      if (pointerX >= start && pointerX <= end) {
        return d;
      }

      // Fallback: Distance to center
      const bandCenter = start + bandwidth / 2;
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

/**
 * Resolves the X coordinate for a given data value on the scale.
 * Handles bandwidth centering for categorical scales.
 */
export function snapToData(scale: ChartXScale, value: string | number): number {
  if ("bandwidth" in scale && typeof scale.bandwidth === "function") {
    return (scale as any)(value) + scale.bandwidth() / 2;
  }
  return (scale as any)(value) ?? 0;
}
