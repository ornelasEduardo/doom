import { Behavior } from "../types/events";
import { InteractionChannel } from "../types/interaction";

export interface CursorOptions {
  /**
   * The interaction channel to listen to.
   * Defaults to `InteractionChannel.PRIMARY_HOVER`.
   */
  on?: InteractionChannel | string;

  /**
   * Whether to display the vertical crosshair line (X-axis).
   * @default true
   */
  showX?: boolean;

  /**
   * Whether to display the horizontal crosshair line (Y-axis).
   * @default false
   */
  showY?: boolean;
}

/**
 * A behavior that draws a crosshair (cursor lines) at the active interaction point.
 *
 * This behavior listens to the interaction store and draws vertical and/or horizontal lines
 * on the chart's SVG layer to help users align data points with the axes.
 *
 * @example
 * ```tsx
 * // Show only the vertical line (default)
 * Cursor()
 *
 * // Show both vertical and horizontal lines
 * Cursor({ showY: true })
 * ```
 *
 * @param options - Configuration options for the cursor lines
 * @returns A Behavior function
 */
export const Cursor = (options: CursorOptions = {}): Behavior => {
  const {
    on = InteractionChannel.PRIMARY_HOVER,
    showX = true,
    showY = false,
  } = options;

  return ({ upsertInteraction, removeInteraction }) => {
    // Sync configuration to the store so the Cursor component can read it
    upsertInteraction(InteractionChannel.CURSOR_CONFIG, {
      on,
      ...options,
    });

    return () => {
      removeInteraction(InteractionChannel.CURSOR_CONFIG);
    };
  };
};
