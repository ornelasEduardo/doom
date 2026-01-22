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

export interface EdgeDetectionOptions {
  /** Horizontal gap between anchor and tooltip (default: TOOLTIP_GAP_X) */
  gapX?: number;
  /** Vertical gap between anchor and tooltip (default: TOOLTIP_GAP_Y) */
  gapY?: number;
  /** Extra vertical offset for touch interactions (default: TOUCH_OFFSET_Y) */
  touchOffsetY?: number;
}

/**
 * Calculates edge-corrected tooltip position.
 *
 * Default behavior: tooltip appears to the right of the anchor.
 * Flips to left if it would overflow the right viewport edge.
 * Adjusts Y to keep tooltip within viewport bounds.
 */
export function calculateEdgeCorrectedPosition(
  input: EdgeDetectionInput,
  options: EdgeDetectionOptions = {},
): EdgeCorrectedPosition {
  const {
    anchorX,
    anchorY,
    tooltipWidth,
    tooltipHeight,
    containerLeft,
    containerWidth,
    isTouch = false,
  } = input;

  const gapX = options.gapX ?? TOOLTIP_GAP_X;
  const gapY = options.gapY ?? TOOLTIP_GAP_Y;
  const touchOffsetY = options.touchOffsetY ?? TOUCH_OFFSET_Y;

  const viewportWidth =
    typeof window !== "undefined" ? window.innerWidth : 1920;
  const viewportHeight =
    typeof window !== "undefined" ? window.innerHeight : 1080;

  // Calculate X position
  let x: number;
  let placement: EdgeCorrectedPosition["placement"] = "right";

  // Check if tooltip would overflow right edge
  const rightEdgeX = containerLeft + anchorX + gapX + tooltipWidth;
  const wouldOverflowRight = rightEdgeX > viewportWidth - VIEWPORT_MARGIN;

  if (wouldOverflowRight) {
    // Try left side
    const leftEdgeX = containerLeft + anchorX - gapX - tooltipWidth;
    const wouldOverflowLeft = leftEdgeX < VIEWPORT_MARGIN;

    if (wouldOverflowLeft) {
      // Both sides overflow - prefer right but clamp to container
      x = Math.min(
        anchorX + gapX,
        containerWidth - tooltipWidth - VIEWPORT_MARGIN,
      );
      placement = "right";
    } else {
      // Place on left
      x = anchorX - gapX - tooltipWidth;
      placement = "left";
    }
  } else {
    // Place on right (default)
    x = anchorX + gapX;
  }

  // Calculate Y position
  const baseY = isTouch ? anchorY - touchOffsetY : anchorY + gapY;

  // Clamp to viewport bounds
  let y = baseY;
  const absoluteY = containerLeft > 0 ? baseY : baseY; // Simplified - could factor in containerTop

  if (absoluteY + tooltipHeight > viewportHeight - VIEWPORT_MARGIN) {
    // Would overflow bottom - move up
    y = anchorY - tooltipHeight - gapY;
    if (placement === "right" || placement === "left") {
      placement = "above";
    }
  }

  if (y < VIEWPORT_MARGIN) {
    // Would overflow top - clamp to top
    y = VIEWPORT_MARGIN;
    if (placement === "above") {
      placement = "below";
    }
  }

  return { x, y, placement };
}

/**
 * Generates a CSS transform string from edge-corrected position.
 */
export function toTransformString(position: EdgeCorrectedPosition): string {
  return `translate(${position.x}px, ${position.y}px)`;
}
