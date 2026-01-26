import { InteractionTarget } from "../../../../types/interaction";
import { Scale } from "../../../../types/scales";
import { Series } from "../../../../types/series";
import { resolveAccessor } from "../../../../utils/accessors";
import { findNearestDataPoint } from "../../../../utils/interaction";
import { InteractionStrategy } from "../types";

/**
 * LinearStrategy provides a straightforward O(n) search for the nearest data point.
 * Best suited for small datasets (n < 50) where the overhead of spatial indexing
 * (like Quadtrees) is not justified.
 */
export class LinearStrategy<T = any> implements InteractionStrategy<T> {
  name = "LinearStrategy";

  constructor(
    private series: Series,
    private data: T[],
  ) {}

  /**
   * Identifies the closest data point within a specified radius using linear search.
   */
  find(
    x: number,
    y: number,
    radius: number,
    xScale: Scale,
    yScale: Scale,
  ): InteractionTarget<T> | null {
    const xAccessor = this.series.xAccessor
      ? resolveAccessor(this.series.xAccessor)
      : (d: any) => d[0];
    const yAccessor = this.series.yAccessor
      ? resolveAccessor(this.series.yAccessor)
      : (d: any) => d[1];

    // Identify the nearest point by its X-coordinate index
    const closestData = findNearestDataPoint(
      x,
      this.data,
      xScale as any,
      xAccessor,
    );

    if (!closestData) {
      return null;
    }

    // Resolve spatial coordinates for the identified target
    let dx = (xScale as any)(xAccessor(closestData));
    const dy = (yScale as any)(yAccessor(closestData)) || 0;

    // Adjust for categorical scales (bar charts)
    if (
      "bandwidth" in xScale &&
      typeof (xScale as any).bandwidth === "function"
    ) {
      dx += (xScale as any).bandwidth() / 2;
    }

    // Enforce interactive radius threshold
    const dist = Math.abs(x - dx);
    if (dist > radius) {
      return null;
    }

    return {
      seriesId: this.series.id,
      seriesColor: this.series.color,
      data: closestData,
      coordinate: { x: dx, y: dy },
      suppressMarker: this.series.type === "bar",
    };
  }
}
