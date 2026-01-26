import { InteractionTarget } from "../../../types/interaction";
import { ChartScale } from "../../../types/scales";

export interface InteractionStrategy<T = any> {
  /**
   * identifying name for debugging
   */
  name: string;

  /**
   * Find the closest data point(s) to the given coordinates
   * @param x - The chart-relative X coordinate (pixels)
   * @param y - The chart-relative Y coordinate (pixels)
   * @param radius - The maximum search radius (pixels)
   * @param xScale - The X scale of the chart
   * @param yScale - The Y scale of the chart
   */
  find(
    x: number,
    y: number,
    radius: number,
    xScale: ChartScale,
    yScale: ChartScale,
  ): InteractionTarget<T> | null;
}
