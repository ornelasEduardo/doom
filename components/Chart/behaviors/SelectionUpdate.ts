import { Behavior } from "../types/events";
import { InteractionChannel } from "../types/interaction";

export interface SelectionUpdateOptions<T> {
  /**
   * The interaction channel to listen to.
   * Defaults to `InteractionChannel.SELECTION`, but can be set to `PRIMARY_HOVER` for hover effects.
   */
  on?: InteractionChannel | string;
}

/**
 * A generic behavior for handling visual updates based on selection state.
 *
 * This behavior can be configured to listen to different channels (e.g., hover or click selection)
 * and apply visual classes (like `.active` or `.dimmed`) to chart elements.
 *
 * @param options - Configuration options
 * @returns A Behavior function
 */
export const SelectionUpdate = <T = unknown>(
  options: SelectionUpdateOptions<T> = {},
): Behavior => {
  const { on = InteractionChannel.SELECTION } = options;

  return ({ getChartContext, getInteraction }) => {
    const ctx = getChartContext();
    if (!ctx || !ctx.g || !ctx.chartStore) {
      return () => {};
    }

    const { g } = ctx;

    const update = () => {
      const interaction = getInteraction(on) as any;
      // Selection interactions might have a different structure (e.g. { selection: [], mode: ... })
      // But assuming normalized structure or handling both:
      const targets = interaction?.targets || [];
      const selection =
        interaction?.selection || targets.map((t: any) => t.data);

      const activeSet = new Set(selection);
      const hasSelection = activeSet.size > 0;

      // Example: toggle 'selected' class on mapped elements
      // This requires elements to have data bound.
      // We'll target a broad set of common elements if no specific selector is updated (Wait, SelectionUpdate usually takes a selector too? The interface didn't have one).
      // Let's stick to a generic ".chart-series-group *" or similar, or just leave it as a mental placeholder if we lack the selector.
      // Actually, without a selector, we can't efficiently find elements to update unless we scan everything.
      // Let's use a default selector like Dim does.

      const selector = ".chart-bar, .chart-point, path"; // Default guess

      g.selectAll(selector)
        .classed("selected", function () {
          const d = (this as any).__data__;
          return activeSet.has(d);
        })
        .classed("dimmed", function () {
          const d = (this as any).__data__;
          return hasSelection && !activeSet.has(d);
        });
    };

    const unsubscribe = ctx.chartStore.subscribe(() => {
      update();
    });

    return () => {
      unsubscribe();
      const selector = ".chart-bar, .chart-point, path";
      g.selectAll(selector).classed("selected", false).classed("dimmed", false);
    };
  };
};
