import { Behavior } from "../types/events";
import { InteractionChannel, InteractionTarget } from "../types/interaction";

export interface MarkersOptions {
  /**
   * The interaction channel to listen to.
   * Defaults to `InteractionChannel.PRIMARY_HOVER`.
   */
  on?: InteractionChannel | string;

  /**
   * The radius of the marker circle in pixels.
   * @default 4
   */
  radius?: number;

  /**
   * Optional fixed color for the marker.
   * If not provided, it usually defaults to the series color of the highlighted point.
   */
  color?: string;
}

/**
 * A behavior that displays a circular marker at the nearest data point.
 *
 * This is commonly used in line charts to strictly identify the exact data point
 * corresponding to the cursor's X-position.
 *
 * @example
 * ```tsx
 * // Render an 8px radius marker on hover
 * Markers({ radius: 8 })
 * ```
 *
 * @param options - Configuration options for the markers
 * @returns A Behavior function
 */
export const Markers = (options: MarkersOptions = {}): Behavior => {
  const { on = InteractionChannel.PRIMARY_HOVER, radius = 4 } = options;

  return ({ getChartContext, getInteraction }) => {
    const ctx = getChartContext();
    if (!ctx || !ctx.g) {
      return () => {};
    }

    const { g } = ctx;
    const layer = g.append("g").attr("class", "chart-markers-layer");

    const update = () => {
      const interaction = getInteraction(on) as any;
      const targets = (interaction?.targets as InteractionTarget[]) || [];

      // Retrieve dimensions for margin correction
      const { margin } = ctx.chartStore.getState().dimensions;

      // Bind data to circles
      const circles = layer
        .selectAll("circle")
        .data(targets, (d: any) => d.seriesId || Math.random());

      // Enter
      circles
        .enter()
        .append("circle")
        .attr("r", radius)
        .attr("fill", (d) => d.seriesColor || options.color || "currentColor")
        .attr("stroke", "var(--card-border)")
        .attr("stroke-width", 2)
        .attr("cx", (d) => d.coordinate.x - margin.left)
        .attr("cy", (d) => d.coordinate.y - margin.top)
        .style("opacity", 1);

      // Update
      circles
        .attr("cx", (d) => d.coordinate.x - margin.left)
        .attr("cy", (d) => d.coordinate.y - margin.top)
        .attr("fill", (d) => d.seriesColor || options.color || "currentColor");

      // Exit
      circles.exit().remove();
    };

    const unsubscribe = ctx.chartStore.subscribe(() => {
      update();
    });

    return () => {
      unsubscribe();
      layer.remove();
    };
  };
};
