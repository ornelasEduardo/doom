/**
 * Engine Type Definitions
 *
 * These types define the core data structures for the Hyper-Engine architecture.
 * They are intentionally decoupled from React and DOM to enable pure logic testing.
 */

// =============================================================================
// INPUT SIGNAL (The Universal Input Format)
// =============================================================================

/**
 * The source of an input signal. Used for multiplayer and debugging.
 */
export enum InputSource {
  MOUSE = "mouse",
  TOUCH = "touch",
  KEYBOARD = "keyboard",
  REMOTE = "remote",
}

/**
 * The type of input action being performed.
 */
export enum InputAction {
  START = "START",
  MOVE = "MOVE",
  END = "END",
  CANCEL = "CANCEL",
  KEY = "KEY",
}

/**
 * InputSignal is the normalized, DOM-independent representation of a user input.
 * This is what the Engine processes - NOT raw PointerEvents.
 *
 * Think of this as the "packet" that travels through the engine pipeline.
 */
export interface InputSignal {
  /** Unique identifier for this input stream (e.g., pointerId for multi-touch) */
  id: number;

  /** The action being performed */
  action: InputAction;

  /** Where this input came from */
  source: InputSource;

  /** X coordinate relative to the chart container (NOT the viewport) */
  x: number;

  /** Y coordinate relative to the chart container */
  y: number;

  /** High-resolution timestamp (performance.now()) for frame scheduling */
  timestamp: number;

  /** User identifier for multiplayer support. 'local' for the current user. */
  userId: string;

  /** Optional: For keyboard events, the key that was pressed */
  key?: string;

  /** Optional: Modifier keys state */
  modifiers?: {
    shift: boolean;
    ctrl: boolean;
    alt: boolean;
    meta: boolean;
  };
}

// =============================================================================
// INTERACTION CANDIDATE (The Hydrated Hit Result)
// =============================================================================

/**
 * The type of element that was hit by the spatial query.
 */
export type CandidateType =
  | "data-point" // A single data point (scatter, line vertex)
  | "bar" // A bar in a bar chart
  | "area" // An area shape
  | "label" // A text label (axis tick, annotation)
  | "axis" // The axis line itself
  | "legend-item" // A legend entry
  | "custom"; // User-defined interactive element

/**
 * InteractionCandidate is a "hydrated" hit result.
 * It contains everything a Sensor needs to make a decision.
 */
export interface InteractionCandidate<T = unknown> {
  /** What kind of element this is */
  type: CandidateType;

  /** The underlying data object (if applicable) */
  data?: T;

  /** The series this belongs to (if applicable) */
  seriesId?: string;

  /** The index within the series (for data points) */
  dataIndex?: number;

  /** The pixel coordinates of this candidate (for snapping) */
  coordinate: { x: number; y: number };

  /** Distance from the pointer (for sorting by proximity) */
  distance: number;

  /** The DOM element that was hit (for DOM-sourced candidates) */
  element?: Element;

  /** Whether this candidate is draggable */
  draggable?: boolean;

  /** Whether this candidate should suppress marker rendering */
  suppressMarker?: boolean;

  /** Z-index for layering (higher = on top) */
  zIndex?: number;
}

// =============================================================================
// ENGINE EVENT (The Final Output to Sensors)
// =============================================================================

/**
 * EngineEvent is the fully processed event that gets dispatched to Sensors.
 * It combines the raw input with the spatial query results.
 */
export interface EngineEvent<T = unknown> {
  /** The normalized input that triggered this event */
  signal: InputSignal;

  /** All candidates found by the spatial query, sorted by relevance */
  candidates: InteractionCandidate<T>[];

  /** The primary (closest/most relevant) candidate, if any */
  primaryCandidate?: InteractionCandidate<T>;

  /** X coordinate relative to the plot area (after margins) */
  chartX: number;

  /** Y coordinate relative to the plot area */
  chartY: number;

  /** Whether the pointer is within the plot area bounds */
  isWithinPlot: boolean;
}

// =============================================================================
// SCHEDULER TYPES
// =============================================================================

/**
 * Priority levels for the scheduler.
 * Critical tasks run synchronously to enable preventDefault().
 * Visual tasks are batched to requestAnimationFrame.
 */
export enum TaskPriority {
  /** Must run immediately (pointer down, to enable preventDefault) */
  CRITICAL = 0,

  /** Can be batched to next frame (hover updates, tooltip positioning) */
  VISUAL = 1,

  /** Low priority, can be deferred (analytics, logging) */
  IDLE = 2,
}

/**
 * A task to be scheduled by the engine.
 */
export interface ScheduledTask<T = unknown> {
  priority: TaskPriority;
  event: EngineEvent<T>;
  timestamp: number;
}
