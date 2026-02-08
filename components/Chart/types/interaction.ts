/**
 * Event type for chart interactions (native DOM events)
 */
export type ChartNativeEvent = MouseEvent | TouchEvent;

// =============================================================================
// INTERACTION STORE TYPES
// =============================================================================

/**
 * Standard Interaction Channels used as keys in the store's interactions Map.
 * This allows multiple sensors to write to different logical streams.
 */
export enum InteractionChannel {
  PRIMARY_HOVER = "primary-hover",
  SELECTION = "selection",
  CROSSHAIR = "crosshair",
  TOOLTIP_CONFIG = "tooltip-config",
  CURSOR_CONFIG = "cursor-config",
  DRAG = "drag",
}

export enum InteractionType {
  HOVER = "hover",
  SELECTION = "selection",
}

export type HoverMode = "nearest-x" | "nearest-y" | "closest" | "exact";

export interface InteractionTarget<T = any> {
  data: T;
  // The exact coordinates of this active data point (e.g. for snapping cursor)
  coordinate: { x: number; y: number };
  // Which series this point belongs to
  seriesId?: string;
  seriesColor?: string;
  suppressMarker?: boolean;
}

export interface HoverInteraction<T = any> {
  // The raw pointer position relative to the chart plot area
  pointer: {
    x: number;
    y: number;
    containerX: number;
    containerY: number;
    isTouch: boolean;
  };

  /**
   * For professional crosshairs, we often want to highlight MULTIPLE points
   * at a specific X-index across all series.
   */
  targets: InteractionTarget<T>[];
  target?: InteractionTarget<T>;
}

// =============================================================================
// SELECTION STATE
// =============================================================================

export interface SelectionInteraction<T = any> {
  selection: T[]; // Array of selected data objects
  mode: "continuous" | "discrete"; // e.g. Brush vs Click
}

// =============================================================================
// DRAG STATE
// =============================================================================

export interface DragInteraction<T = any> {
  /** The data point being dragged */
  target: InteractionTarget<T>;
  /** Current pixel position during drag */
  currentPosition: { x: number; y: number };
  /** Starting pixel position when drag began */
  startPosition: { x: number; y: number };
  /** Current value in data domain (inverted from pixel) */
  currentValue: { x: any; y: any };
  /** Whether the drag is currently active */
  isDragging: boolean;
}

export type Interaction =
  | HoverInteraction
  | SelectionInteraction
  | DragInteraction;
