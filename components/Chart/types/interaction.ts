/**
 * Event type for chart interactions (native DOM events)
 */
export type ChartNativeEvent = MouseEvent | TouchEvent;

export interface InteractionState {
  chartX: number; // Relative to Plot 0,0
  chartY: number; // Relative to Plot 0,0
  containerX: number; // Relative to Container (for tooltips)
  containerY: number; // Relative to Container (for tooltips)
  isWithinPlot: boolean;
  isTouch: boolean;
}

// =============================================================================
// HOVER STATE - Mouse/touch interaction state for tooltips and cursors
// =============================================================================

/**
 * Represents the current hover state during chart interaction.
 * Contains position data for both the cursor line (snapped to data) and
 * the tooltip (follows mouse).
 */
export interface HoverState<T> {
  /**
   * X position for the cursor line (snapped to nearest data point).
   * Relative to the chart SVG element, includes margin offset.
   */
  cursorLineX: number;

  /**
   * Y position for the cursor line.
   * Relative to the chart SVG element, includes margin offset.
   */
  cursorLineY: number;

  /**
   * Raw pointer X position for tooltip tracking.
   * Follows the actual mouse/touch position, not snapped to data.
   * Relative to the chart wrapper element.
   */
  tooltipX: number;

  /**
   * Raw pointer Y position for tooltip tracking.
   * Follows the actual mouse/touch position.
   * Relative to the chart wrapper element.
   */
  tooltipY: number;

  /** The data point being hovered */
  data: T;

  /** Whether this is a touch interaction (vs mouse) */
  isTouch: boolean;
}
