import { Behavior } from "../types/events";
import { InteractionChannel } from "../types/interaction";

export interface TooltipOptions<T = any> {
  /**
   * The interaction channel to listen to.
   * Defaults to `InteractionChannel.PRIMARY_HOVER`.
   */
  on?: InteractionChannel | string;

  /**
   * Optional custom render function for the tooltip content.
   * If provided, this will override the default rendering logic.
   */
  render?: (data: T) => React.ReactNode;
}

/**
 * A "passive" behavior that synchronizes the chart's interaction state with the Tooltip subcomponent.
 *
 * Use this behavior when you want a standard hover tooltip. It listens to the specified
 * interaction channel (usually `PRIMARY_HOVER`) and ensures clarity and consistency
 * in how tooltip data is resolved.
 *
 * @example
 * ```tsx
 * <Chart behaviors={[Tooltip()]} />
 * ```
 *
 * @param options - Configuration options for the tooltip behavior
 * @returns A Behavior function that can be consumed by the Chart
 */
export const Tooltip = <T>(options: TooltipOptions<T> = {}): Behavior => {
  const { on = InteractionChannel.PRIMARY_HOVER } = options;

  return ({ getInteraction, upsertInteraction, removeInteraction }) => {
    // Sync configuration to the store so the Tooltip component can read it
    upsertInteraction(InteractionChannel.TOOLTIP_CONFIG, {
      on,
      ...options,
    });

    // Cleanup: remove config when behavior unmounts
    return () => {
      removeInteraction(InteractionChannel.TOOLTIP_CONFIG);
    };
  };
};
