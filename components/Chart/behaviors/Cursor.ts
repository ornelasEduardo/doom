import { Behavior, GenericBehavior } from "../types/events";
import {
  ChannelReference,
  HoverInteraction,
  InteractionChannel,
} from "../types/interaction";

export interface CursorOptions<T = unknown> {
  /**
   * The interaction channel to listen to.
   * Defaults to `InteractionChannel.PRIMARY_HOVER`.
   */
  on?: ChannelReference<HoverInteraction<T>>;

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
let nextCursorOwner = 0;

export function Cursor(
  options?: Omit<CursorOptions, "on"> & { on?: string },
): GenericBehavior;
export function Cursor<T>(options: CursorOptions<T>): Behavior<T>;
export function Cursor<T = unknown>(
  options: CursorOptions<T> = {},
): Behavior<T> {
  const {
    on = InteractionChannel.PRIMARY_HOVER,
    showX = true,
    showY = false,
  } = options;

  return ({ upsertInteraction, removeInteraction }) => {
    const key =
      `${InteractionChannel.CURSOR_CONFIG}:${++nextCursorOwner}` as const;
    upsertInteraction(key, {
      ...options,
      on,
      showX,
      showY,
    });

    return () => {
      removeInteraction(key);
    };
  };
}
