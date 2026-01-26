import { Behavior } from "../types/events";
import { InteractionChannel, InteractionTarget } from "../types/interaction";

export interface DimOptions<T> {
  /**
   * The CSS selector for the elements that should be affected by dimming.
   * Typically matches series elements like bars, points, or lines.
   * @default ".chart-series-group, rect, circle, path"
   */
  selector?: string;

  /**
   * The opacity value to apply to *dimmed* (non-active) elements.
   * Active elements will retain their original opacity (usually 1).
   * @default 0.3
   */
  opacity?: number;

  /**
   * The interaction channel to listen to.
   * Defaults to `InteractionChannel.PRIMARY_HOVER`.
   */
  on?: InteractionChannel | string;
}

/**
 * A behavior that creates a "focus" effect by dimming unrelated elements.
 *
 * When an element is hovered (or selected), this behavior reduces the opacity
 * of all other matching elements, drawing attention to the active data.
 *
 * @example
 * ```tsx
 * // Dim all bars except the one being hovered
 * Dim({ selector: ".chart-bar", opacity: 0.2 })
 * ```
 *
 * @param options - Configuration options for the dimming effect
 * @returns A Behavior function
 */
export const Dim = <T = unknown>(options: DimOptions<T> = {}): Behavior => {
  const {
    selector = ".chart-series-group, rect, circle, path",
    opacity = 0.3,
    on = InteractionChannel.PRIMARY_HOVER,
  } = options;

  return ({ getChartContext, getInteraction }) => {
    const ctx = getChartContext();
    if (!ctx || !ctx.g) {
      return () => {};
    }

    const { g } = ctx;

    const update = () => {
      const interaction = getInteraction(on) as any;
      const targets = (interaction?.targets as InteractionTarget[]) || [];
      const activeData = new Set(targets.map((t) => t.data));
      const hasActive = activeData.size > 0;

      // Select all elements matching the selector
      g.selectAll(selector).style("opacity", function () {
        if (!hasActive) {
          return 1;
        }

        // D3 datum check
        const elementData = (this as any).__data__;

        // Check if this element's data is in the active set
        // Note: This matches referentially. Might need ID check for robustness.
        const isActive = activeData.has(elementData);

        return isActive ? 1 : opacity;
      });
    };

    const unsubscribe = ctx.chartStore.subscribe(() => {
      update();
    });

    return () => {
      unsubscribe();
      // Reset opacity on cleanup
      g.selectAll(selector).style("opacity", 1);
    };
  };
};
