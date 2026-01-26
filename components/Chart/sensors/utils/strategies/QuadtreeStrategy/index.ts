import { Quadtree, quadtree } from "d3-quadtree";

import { InteractionTarget } from "../../../../types/interaction";
import { ChartScale } from "../../../../types/scales";
import { Series } from "../../../../types/series";
import { resolveAccessor } from "../../../../utils/accessors";
import { InteractionStrategy } from "../types";

export class QuadtreeStrategy<T = any> implements InteractionStrategy<T> {
  name = "QuadtreeStrategy";

  private tree: Quadtree<T> | null = null;
  private lastXScale: ChartScale | null = null;
  private lastYScale: ChartScale | null = null;

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
  }

  private rebuildTree(xScale: ChartScale, yScale: ChartScale) {
    // Map data to pixels
    this.tree = quadtree<T>()
      .x((d) => (xScale as any)(this.xAccessor(d)) ?? NaN)
      .y((d) => (yScale as any)(this.yAccessor(d)) ?? NaN)
      .addAll(this.data);

    this.lastXScale = xScale;
    this.lastYScale = yScale;
  }

  find(
    x: number,
    y: number,
    radius: number,
    xScale: ChartScale,
    yScale: ChartScale,
  ): InteractionTarget<T> | null {
    // Lazy rebuild if scales change (e.g. resize, zoom)
    if (
      this.lastXScale !== xScale ||
      this.lastYScale !== yScale ||
      !this.tree
    ) {
      this.rebuildTree(xScale, yScale);
    }

    if (!this.tree) {
      return null;
    }

    // Use quadtree finding
    const closest = this.tree.find(x, y, radius);

    if (!closest) {
      return null;
    }

    const px = (xScale as any)(this.xAccessor(closest));
    const py = (yScale as any)(this.yAccessor(closest));

    return {
      seriesId: this.series.id,
      seriesColor: this.series.color,
      data: closest,
      coordinate: { x: px, y: py },
    };
  }
}
