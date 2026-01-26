import { Behavior } from "../types/events";
import { InteractionChannel } from "../types/interaction";

export interface SelectionUpdateOptions<T> {
  /**
   * The interaction channel to listen to.
   * Defaults to `InteractionChannel.SELECTION`, but can be set to `PRIMARY_HOVER` for hover effects.
   */
  on?: InteractionChannel | string;

  /**
   * CSS selector to target elements for updates.
   * Defaults to ".chart-bar, .chart-point, path".
   */
  selector?: string;

  /**
   * Optional custom update function.
   * If provided, this function is called with the D3 selection of matched elements and the interaction payload.
   */
  fn?: (selection: any, activeData: any) => void;
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
  const {
    on = InteractionChannel.SELECTION,
    selector = ".chart-bar, .chart-point, path",
    fn,
  } = options;

  return ({ getChartContext, getInteraction }) => {
    const ctx = getChartContext();
    if (!ctx || !ctx.g || !ctx.chartStore) {
      return () => {};
    }

    const { g } = ctx;

    const update = () => {
      const interaction = getInteraction(on) as any;
      const targets = interaction?.targets || [];
      // If we have a direct selection (e.g. from ClickSensor), use it.
      // Otherwise map targets (from HoverSensor) to data.
      let activeData = interaction?.data; // Direct data payload from some sensors
      if (!activeData && targets.length > 0) {
        activeData = targets[0]; // Wrapper { element, data }
      }

      // For the custom function, we might want the raw interaction or the processed data
      // Let's pass the interaction payload or the 'primary' target data.
      // The Story uses `fn: (selection, activeData) => ...` where activeData seems to be the target object.

      const selectionSet = g.selectAll(selector);

      if (fn) {
        fn(selectionSet, activeData);
        return;
      }

      // Default behavior: toggle classes
      const selectionData =
        interaction?.selection || targets.map((t: any) => t.data);
      const activeSet = new Set(selectionData);
      const hasSelection = activeSet.size > 0;

      selectionSet
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
      if (!fn) {
        g.selectAll(selector)
          .classed("selected", false)
          .classed("dimmed", false);
      }
    };
  };
};
