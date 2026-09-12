import { Behavior, GenericBehavior } from "../types/events";
import {
  ChannelReference,
  HoverInteraction,
  InteractionChannel,
  InteractionTarget,
} from "../types/interaction";

export interface MarkersOptions<T = unknown> {
  /**
   * The interaction channel to listen to.
   * Defaults to `InteractionChannel.PRIMARY_HOVER`.
   */
  on?: ChannelReference<HoverInteraction<T>>;

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
export function Markers(
  options?: Omit<MarkersOptions, "on"> & { on?: string },
): GenericBehavior;
export function Markers<T>(options: MarkersOptions<T>): Behavior<T>;
export function Markers<T = unknown>(
  options: MarkersOptions<T> = {},
): Behavior<T> {
  const { on = InteractionChannel.PRIMARY_HOVER, radius = 4 } = options;

  return ({ getChartContext, getInteraction }) => {
    const ctx = getChartContext();
    if (!ctx || !ctx.g) {
      return () => {};
    }

    const { g } = ctx;
    const layer = g.append("g").attr("class", "chart-markers-layer");

    const update = () => {
      const interaction = (
        typeof on === "string" ? getInteraction(on) : getInteraction(on)
      ) as HoverInteraction<T> | null;
      const targets = interaction?.targets || [];

      // Retrieve dimensions for margin correction
      const { margin } = ctx.chartStore.getState().dimensions;

      // Bind data to circles
      const circles = layer
        .selectAll<SVGCircleElement, InteractionTarget<T>>("circle")
        // Stable key, so the join moves the marker rather than re-creating it.
        .data(
          targets,
          (d, i) => `${d?.seriesId ?? "series"}:${d?.dataIndex ?? i}`,
        );

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

    update();

    return () => {
      unsubscribe();
      layer.remove();
    };
  };
}
