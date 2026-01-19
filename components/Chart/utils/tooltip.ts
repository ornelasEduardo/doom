/**
 * Tooltip positioning utilities for Chart components.
 *
 * This module centralizes all tooltip positioning logic to ensure consistency
 * and prevent regressions. The tooltip follows the mouse cursor and appears
 * to its right (or left if it would overflow the viewport).
 */

// ============================================================================
// Constants
// ============================================================================

/** Horizontal gap between cursor and tooltip edge (in pixels) */
export const TOOLTIP_HORIZONTAL_GAP = 48;

/** Minimum distance from viewport edge before flipping tooltip position (in pixels) */
export const VIEWPORT_EDGE_MARGIN = 20;

/** Vertical offset for touch interactions to avoid finger occlusion (in pixels) */
export const TOUCH_VERTICAL_OFFSET = 50;

// ============================================================================
// Types
// ============================================================================

/**
 * Position data from mouse/touch interaction.
 * All coordinates are relative to the chart wrapper element.
 */
export interface TooltipPositionInput {
  /** X position of the cursor (relative to wrapper) */
  cursorX: number;
  /** Y position of the cursor (relative to wrapper) */
  cursorY: number;
  /** Whether this is a touch interaction */
  isTouch: boolean;
}

/**
 * Bounding information needed for tooltip positioning calculations.
 */
export interface TooltipBounds {
  /** Tooltip element width in pixels */
  tooltipWidth: number;
  /** Left edge of wrapper element relative to viewport */
  wrapperLeft: number;
}

// ============================================================================
// Functions
// ============================================================================

/**
 * Calculates the CSS transform string to position the tooltip.
 *
 * The tooltip is positioned:
 * - Horizontally: To the right of the cursor with TOOLTIP_HORIZONTAL_GAP spacing.
 *   If this would cause overflow on the right edge of the viewport, it flips to the left.
 * - Vertically: Top edge aligned with cursor Y position (offset up for touch).
 *
 * @param position - Cursor position data
 * @param bounds - Tooltip and wrapper bounding information
 * @returns CSS transform string (translate3d)
 */

export function calculateTooltipTransform(
  position: TooltipPositionInput,
  bounds: TooltipBounds,
): string {
  const { cursorX, cursorY, isTouch } = position;
  const { tooltipWidth, wrapperLeft } = bounds;

  // Calculate absolute X position in viewport
  const absoluteX = wrapperLeft + cursorX;

  // Determine horizontal offset (default: position to the right of cursor)
  let horizontalOffset = TOOLTIP_HORIZONTAL_GAP;

  // Check if tooltip would overflow right edge of viewport
  const wouldOverflowRight =
    absoluteX + tooltipWidth + TOOLTIP_HORIZONTAL_GAP >
    window.innerWidth - VIEWPORT_EDGE_MARGIN;

  if (wouldOverflowRight) {
    // Flip to left side of cursor
    // We reduce the gap slightly on the left to visually balance the cursor's footprint
    // and drop shadows which might make the gap feel larger than it is.
    horizontalOffset = -tooltipWidth;
  }

  // Check if flipping left would cause left edge overflow
  const wouldOverflowLeft =
    wrapperLeft + cursorX + horizontalOffset < VIEWPORT_EDGE_MARGIN;

  if (wouldOverflowLeft) {
    // Stay on right side even if it overflows (better than left overflow)
    horizontalOffset = TOOLTIP_HORIZONTAL_GAP;
  }

  // Calculate vertical position (offset up for touch to avoid finger)
  const verticalPosition = isTouch ? cursorY - TOUCH_VERTICAL_OFFSET : cursorY;

  return `translate3d(${cursorX + horizontalOffset}px, ${verticalPosition}px, 0)`;
}
