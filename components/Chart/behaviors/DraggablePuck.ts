import { Behavior } from "../types/events";
import { DragInteraction, InteractionChannel } from "../types/interaction";

export interface DraggablePuckOptions {
  /**
   * Interaction channel to listen to.
   * @default InteractionChannel.DRAG
   */
  on?: InteractionChannel | string;

  /**
   * Radius of the puck circle in pixels.
   * @default 8
   */
  radius?: number;

  /**
   * Color of the puck. If not specified, uses the series color.
   */
  color?: string;

  /**
   * Whether to show a "ghost" at the original position during drag.
   * @default true
   */
  showGhost?: boolean;
}

/**
 * DraggablePuck renders a visual indicator at the drag position.
 *
 * It creates a "puck" circle that follows the cursor during drag operations,
 * providing immediate visual feedback. Optionally shows a ghost at the
 * original position.
 *
 * @example
 * ```tsx
 * DraggablePuck({ radius: 10, showGhost: true })
 * ```
 */
export const DraggablePuck = (options: DraggablePuckOptions = {}): Behavior => {
  const {
    on = InteractionChannel.DRAG,
    radius = 8,
    color,
    showGhost = true,
  } = options;

  return ({ getChartContext, getInteraction }) => {
    const ctx = getChartContext();
    if (!ctx || !ctx.g) {
      return () => {};
    }

    const { g } = ctx;
    const layer = g.append("g").attr("class", "chart-drag-puck-layer");

    // Ghost circle (original position)
    const ghost = layer
      .append("circle")
      .attr("class", "drag-ghost")
      .attr("r", radius)
      .attr("fill", "none")
      .attr("stroke", "var(--text-tertiary)")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4,2")
      .style("opacity", 0)
      .style("pointer-events", "none");

    // Active puck circle (current drag position)
    const puck = layer
      .append("circle")
      .attr("class", "drag-puck")
      .attr("r", radius)
      .attr("stroke", "var(--card-border)")
      .attr("stroke-width", 2)
      .style("opacity", 0)
      .style("cursor", "grabbing")
      .style("filter", "drop-shadow(0 2px 4px rgba(0,0,0,0.2))")
      .style("pointer-events", "none");

    // Connection line between ghost and puck
    const line = layer
      .append("line")
      .attr("class", "drag-line")
      .attr("stroke", "var(--text-tertiary)")
      .attr("stroke-width", 1)
      .attr("stroke-dasharray", "2,2")
      .style("opacity", 0)
      .style("pointer-events", "none");

    const update = () => {
      const interaction = getInteraction(on) as DragInteraction | null;

      if (!interaction || !interaction.isDragging) {
        puck.style("opacity", 0);
        ghost.style("opacity", 0);
        line.style("opacity", 0);
        return;
      }

      const {
        target,
        currentPosition,
        startPosition: _startPosition,
      } = interaction;
      const puckColor = color || target.seriesColor || "var(--primary)";

      // Update puck position
      puck
        .attr("cx", currentPosition.x)
        .attr("cy", currentPosition.y)
        .attr("fill", puckColor)
        .style("opacity", 1);

      if (showGhost) {
        // Show ghost at original target position
        ghost
          .attr("cx", target.coordinate.x)
          .attr("cy", target.coordinate.y)
          .style("opacity", 0.5);

        // Draw connecting line
        line
          .attr("x1", target.coordinate.x)
          .attr("y1", target.coordinate.y)
          .attr("x2", currentPosition.x)
          .attr("y2", currentPosition.y)
          .style("opacity", 0.5);
      }
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
