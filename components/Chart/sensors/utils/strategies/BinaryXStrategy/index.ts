import { bisector } from "d3-array";

import { InteractionTarget } from "../../../../types/interaction";
import { ChartScale } from "../../../../types/scales";
import { Series } from "../../../../types/series";
import { resolveAccessor } from "../../../../utils/accessors";
import { InteractionStrategy } from "../types";

export class BinaryXStrategy<T = any> implements InteractionStrategy<T> {
  name = "BinaryXStrategy";
  private bisect: (list: T[], x: number) => number;
  private xAccessor: (d: T) => any;
  private yAccessor: (d: T) => any;

  constructor(
    private series: Series,
    private data: T[],
  ) {
    this.xAccessor = series.xAccessor
      ? resolveAccessor(series.xAccessor)
      : (d: any) => d[0];
    this.yAccessor = series.yAccessor
      ? resolveAccessor(series.yAccessor)
      : (d: any) => d[1];

    // Create a bisector based on the X value
    // We assume the data passed to this strategy is ALREADY sorted by X
    this.bisect = bisector((d: T) => this.xAccessor(d)).left;
  }

  find(
    x: number,
    _y: number,
    radius: number,
    xScale: ChartScale,
    yScale: ChartScale,
  ): InteractionTarget<T> | null {
    // 1. Invert the pixel X to domain X (if possible)
    let domainX: any;
    if ("invert" in xScale) {
      domainX = xScale.invert(x);
    } else {
      // Cannot use binary search on categorical/band scales without invert
      // Should fall back to LinearStrategy for those, but let's handle gracefully
      return null;
    }

    // 2. Binary Search to find the insertion point
    const index = this.bisect(this.data, domainX);

    // 3. Check neighbors (left and right of index)
    // The bisector gives us the index where the value *would* be.
    // The closest point is either at `index` or `index - 1`.
    const d0 = this.data[index - 1];
    const d1 = this.data[index];

    let closest: T | null = null;

    if (d0 && d1) {
      const x0 = xScale(this.xAccessor(d0));
      const x1 = xScale(this.xAccessor(d1));
      closest = Math.abs(x - x0) < Math.abs(x - x1) ? d0 : d1;
    } else if (d0) {
      closest = d0;
    } else if (d1) {
      closest = d1;
    }

    if (!closest) {
      return null;
    }

    // 4. Validate Radius
    const px = xScale(this.xAccessor(closest));
    const py = (yScale as any)(this.yAccessor(closest)) || 0;

    const dist = Math.abs(x - px);
    if (dist > radius) {
      return null;
    }

    return {
      seriesId: this.series.id,
      seriesColor: this.series.color,
      data: closest,
      coordinate: { x: px, y: py },
    };
  }
}
