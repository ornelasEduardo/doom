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

// =============================================================================
// INTERACTION STORE TYPES
// =============================================================================

export enum InteractionType {
  HOVER = "hover",
  SELECTION = "selection",
  ZOOM = "zoom",
  PAN = "pan",
  BRUSH = "brush",
}

export interface HoverInteraction<T = any> {
  // The raw pointer position relative to the chart plot area
  pointer: {
    x: number;
    y: number;
    isTouch: boolean;
  };

  // The data point that was "snapped" to (if any)
  target: {
    data: T;
    // The exact coordinates of this active data point (e.g. for snapping cursor)
    coordinate: { x: number; y: number };
  } | null;
}

export interface SelectionInteraction<T = any> {
  selection: T[]; // Array of selected data objects
  mode: "continuous" | "discrete"; // e.g. Brush vs Click
}

// =============================================================================
// LEGACY Types (To be deprecated/removed)
// =============================================================================

/**
 * @deprecated Use HoverInteraction from InteractionStore instead
 * Represents the current hover state during chart interaction.
 */
export interface HoverState<T> {
  cursorLineX: number;
  cursorLineY: number;
  tooltipX: number;
  tooltipY: number;
  data: T;
  isTouch: boolean;
}
