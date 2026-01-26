import { InteractionChannel } from "../types/interaction";

export interface SelectionOptions<T = any> {
  /**
   * Selection mode.
   * - 'discrete': Click to select/toggle. (Default)
   * - 'continuous': Brush/Range selection.
   *
   * @default 'discrete'
   */
  mode?: "discrete" | "continuous";

  /**
   * Interaction channel to listen to.
   * Defaults to 'selection'.
   */
  on?: InteractionChannel | string;

  /**
   * Callback when selection changes.
   */
  onSelectionChange?: (selection: T[]) => void;
}

/**
 * Professional-grade Selection behavior.
 * Manages chosen data sets in the store.
 */
export const Selection = <T = any>(
  options: SelectionOptions<T> = { mode: "discrete" },
): Behavior<T> => {
  const { on = InteractionChannel.SELECTION, onSelectionChange } = options;

  return ({ getChartContext }) => {
    const ctx = getChartContext();
    if (!ctx || !ctx.chartStore) {
      return () => {};
    }

    const { chartStore } = ctx;

    // Monitor store for selection changes to trigger callback
    const unsubscribe = chartStore.subscribe(() => {
      const state = chartStore.getState();
      const interaction = state.interactions.get(on);
      if (interaction && "selection" in interaction) {
        onSelectionChange?.(interaction.selection);
      }
    });

    return () => {
      unsubscribe();
      chartStore.setState((prev) => {
        const next = new Map(prev.interactions);
        next.delete(on);
        return { interactions: next };
      });
    };
  };
};
