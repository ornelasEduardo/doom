/**
 * Edge Detection Utility for Tooltip Positioning
 *
 * Calculates tooltip placement adjustments to prevent viewport overflow.
 * Works with any element that needs boundary-aware positioning.
 */

// ============================================================================
// Types
// ============================================================================

export interface EdgeDetectionInput {
  /** X position of the tooltip anchor (e.g. cursor position relative to container) */
  anchorX: number;
  /** Y position of the tooltip anchor */
  anchorY: number;
  /** Width of the tooltip element */
  tooltipWidth: number;
  /** Height of the tooltip element */
  tooltipHeight: number;
  /** Left edge of the container relative to viewport */
  containerLeft: number;
  /** Width of the container */
  containerWidth: number;
  /** Whether this is a touch interaction (affects vertical offset) */
  isTouch?: boolean;
}

export interface EdgeCorrectedPosition {
  /** Corrected X position (relative to container) */
  x: number;
  /** Corrected Y position (relative to container) */
  y: number;
  /** Which side the tooltip is positioned on */
  placement: "right" | "left" | "above" | "below";
}

// ============================================================================
// Constants
// ============================================================================

/** Horizontal gap between anchor and tooltip edge */
export const TOOLTIP_GAP_X = 12;

/** Vertical gap between anchor and tooltip */
export const TOOLTIP_GAP_Y = 8;

/** Minimum distance from viewport edge */
export const VIEWPORT_MARGIN = 8;

/** Extra offset for touch interactions (avoid finger occlusion) */
export const TOUCH_OFFSET_Y = 40;

// ============================================================================
// Main Function
// ============================================================================

export interface OverflowCheckInput {
  x: number;
  y: number;
  width: number;
  height: number;
  containerRect?: DOMRect;
  margin?: number;
}

export interface OverflowResult {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
  boundary: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

/**
 * Checks if a given rectangle overflows the boundaries.
 * Does NOT calculate new positions. Purely a validator.
 */
export function checkOverflow(input: OverflowCheckInput): OverflowResult {
  const {
    x,
    y,
    width,
    height,
    containerRect,
    margin = VIEWPORT_MARGIN,
  } = input;

  const viewportWidth =
    typeof window !== "undefined" ? window.innerWidth : 1920;
  const viewportHeight =
    typeof window !== "undefined" ? window.innerHeight : 1080;

  const containerLeft = containerRect?.left ?? 0;
  const containerTop = containerRect?.top ?? 0;

  // Calculate absolute positions (assuming x/y are relative to container)
  const absoluteX = containerLeft + x;
  const absoluteY = containerTop + y;

  const boundary = {
    top: margin,
    right: viewportWidth - margin,
    bottom: viewportHeight - margin,
    left: margin,
  };

  return {
    top: absoluteY < boundary.top,
    right: absoluteX + width > boundary.right,
    bottom: absoluteY + height > boundary.bottom,
    left: absoluteX < boundary.left,
    boundary,
  };
}

/**
 * Generates a CSS transform string from edge-corrected position.
 */
export function toTransformString(position: EdgeCorrectedPosition): string {
  return `translate(${position.x}px, ${position.y}px)`;
}
