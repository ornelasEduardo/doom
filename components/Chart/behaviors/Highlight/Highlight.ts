import { Selection } from "d3-selection";

import { InteractionType } from "../../types/interaction";
import { d3 } from "../../utils/d3";

export interface HighlightOptions<T = any> {
  /**
   * CSS selector to find target elements within the series container.
   * e.g., '.bar', '.segment', 'path'
   */
  selector: string;

  /**
   * Function to extract a unique identifier from element data.
   * Used to match elements against the interaction target.
   * Defaults to identity (d => d).
   */
  identify?: (data: T) => any;

  /**
   * Callback to apply styles to the selection based on its highlighted state.
   */
  onUpdate: (
    selection: Selection<any, T, any, any>,
    state: { isHighlighted: boolean; isDimmed: boolean },
  ) => void;

  /**
   * The interaction type to trigger this highlight (defaults to HOVER).
   */
  trigger?: InteractionType;
}

/**
 * A generic behavior that applies visual highlights to elements based on interaction state.
 * It uses a selector to find elements and an identification protocol to match data.
 */
export const Highlight = <T = any>(options: HighlightOptions<T>) => {
  const {
    selector,
    identify = (d: T) => d,
    onUpdate,
    trigger = InteractionType.HOVER,
  } = options;

  return ({ getChartContext, interactionStore }: any) => {
    // Subscribe to interaction store updates
    const unsubscribe = interactionStore.subscribe(() => {
      const state = interactionStore.getState();
      const interaction: any = state.interactions.get(trigger);

      const ctx = getChartContext();
      if (!ctx || !ctx.g) {
        return;
      }

      const targetData = interaction?.target?.data;
      const targetId = targetData ? identify(targetData) : null;

      // Find all elements matching the selector
      const elements: Selection<any, T, any, any> = ctx.g.selectAll(selector);

      elements.each(function (this: any, d: T) {
        const itemId = identify(d);
        const isHighlighted = targetId !== null && itemId === targetId;
        const isDimmed = targetId !== null && !isHighlighted;

        onUpdate(d3.select(this) as any, { isHighlighted, isDimmed });
      });
    });

    return () => unsubscribe();
  };
};
