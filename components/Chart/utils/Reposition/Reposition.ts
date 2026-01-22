/**
 * Reposition - Chainable positioning utility for tooltips and overlays
 *
 * Provides a fluent API for calculating element positions with support for:
 * - Anchor-relative positioning
 * - Configurable gaps/spacing
 * - Vertical/horizontal alignment
 * - Viewport edge detection and correction
 * - Touch-friendly offsets
 *
 * @example
 * ```tsx
 * const pos = new Reposition(tooltipRef.current)
 *   .anchor({ x: cursorX, y: cursorY })
 *   .gap({ x: 12 })
 *   .align({ vertical: 'center' })
 *   .edgeDetect()
 *   .resolve();
 *
 * // pos = { x: 150, y: 80, placement: 'right' }
 * ```
 */

import { RefObject } from "react";

import {
  calculateEdgeCorrectedPosition,
  TOOLTIP_GAP_X,
  TOOLTIP_GAP_Y,
  TOUCH_OFFSET_Y,
} from "./edgeDetection";

// ============================================================================
// Types
// ============================================================================

export interface Point {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export type VerticalAlign = "top" | "center" | "bottom";
export type HorizontalAlign = "left" | "center" | "right";
export type Placement = "right" | "left" | "above" | "below";

export interface AlignOptions {
  vertical?: VerticalAlign;
  horizontal?: HorizontalAlign;
}

export interface GapOptions {
  x?: number;
  y?: number;
}

export interface EdgeDetectOptions {
  /** Container element for boundary detection. If not provided, uses viewport. */
  container?: RefObject<HTMLElement | null>;
  /** Minimum margin from edges (default: 8) */
  margin?: number;
}

export interface RepositionResult {
  /** Final X position */
  x: number;
  /** Final Y position */
  y: number;
  /** Which side the element is positioned on */
  placement: Placement;
}

// ============================================================================
// Reposition Class
// ============================================================================

/**
 * Chainable positioning utility for tooltips and overlays.
 *
 * Pass the element to reposition in the constructor, then chain methods
 * to configure positioning behavior, and finally call `resolve()` to
 * get the calculated position.
 */
export class Reposition {
  private element: HTMLElement | null;
  private dimensions: Dimensions | null = null;
  private anchorPoint: Point | null = null;
  private gapX: number = TOOLTIP_GAP_X;
  private gapY: number = TOOLTIP_GAP_Y;
  private verticalAlign: VerticalAlign = "top";
  private horizontalAlign: HorizontalAlign = "left";
  private shouldEdgeDetect: boolean = false;
  private containerRef: RefObject<HTMLElement | null> | null = null;
  private edgeMargin: number = 8;
  private touchOffsetValue: number = TOUCH_OFFSET_Y;
  private isTouch: boolean = false;

  /**
   * Create a new Reposition instance.
   * @param element - The element to reposition (e.g., tooltip ref)
   */
  constructor(element: HTMLElement | null) {
    this.element = element;
    if (element) {
      const rect = element.getBoundingClientRect();
      this.dimensions = { width: rect.width, height: rect.height };
    }
  }

  /**
   * Set the anchor point to position relative to.
   * @param point - The x/y coordinates of the anchor (e.g., cursor position)
   */
  anchor(point: Point): this {
    this.anchorPoint = point;
    return this;
  }

  /**
   * Set the gap/spacing between anchor and element.
   * @param options - Gap configuration
   * @param options.x - Horizontal gap (default: 12)
   * @param options.y - Vertical gap (default: 8)
   */
  gap(options: GapOptions): this {
    if (options.x !== undefined) {
      this.gapX = options.x;
    }
    if (options.y !== undefined) {
      this.gapY = options.y;
    }
    return this;
  }

  /**
   * Set alignment relative to the element dimensions.
   *
   * - `vertical: 'center'` - Element's vertical midpoint aligns with anchor Y
   * - `vertical: 'top'` - Element's top edge aligns with anchor Y (default)
   * - `vertical: 'bottom'` - Element's bottom edge aligns with anchor Y
   *
   * @param options - Alignment configuration
   */
  align(options: AlignOptions): this {
    if (options.vertical !== undefined) {
      this.verticalAlign = options.vertical;
    }
    if (options.horizontal !== undefined) {
      this.horizontalAlign = options.horizontal;
    }
    return this;
  }

  /**
   * Enable edge detection to prevent viewport/container overflow.
   * @param options - Edge detection configuration
   * @param options.container - Container element ref (uses viewport if not provided)
   * @param options.margin - Minimum margin from edges (default: 8)
   */
  edgeDetect(options?: EdgeDetectOptions): this {
    this.shouldEdgeDetect = true;
    if (options?.container) {
      this.containerRef = options.container;
    }
    if (options?.margin !== undefined) {
      this.edgeMargin = options.margin;
    }
    return this;
  }

  /**
   * Apply touch-specific vertical offset to avoid finger occlusion.
   * @param offset - Vertical offset in pixels (default: 40)
   * @param isTouch - Whether this is a touch interaction
   */
  touchOffset(offset: number, isTouch: boolean): this {
    this.touchOffsetValue = offset;
    this.isTouch = isTouch;
    return this;
  }

  /**
   * Calculate and return the final position.
   * @returns Position with x, y, and placement information
   */
  resolve(): RepositionResult {
    if (!this.anchorPoint) {
      console.warn("Reposition: No anchor point set. Call .anchor() first.");
      return { x: 0, y: 0, placement: "right" };
    }

    const dims = this.dimensions ?? { width: 0, height: 0 };
    let { x, y } = this.anchorPoint;

    // Apply horizontal gap (position to the right of anchor by default)
    x += this.gapX;

    // Apply vertical alignment
    switch (this.verticalAlign) {
      case "center":
        y -= dims.height / 2;
        break;
      case "bottom":
        y -= dims.height;
        break;
      case "top":
      default:
        // No adjustment needed - element top aligns with anchor
        break;
    }

    // Apply horizontal alignment
    switch (this.horizontalAlign) {
      case "center":
        x -= dims.width / 2;
        break;
      case "right":
        x -= dims.width;
        break;
      case "left":
      default:
        // No adjustment needed
        break;
    }

    // Apply touch offset
    if (this.isTouch) {
      y -= this.touchOffsetValue;
    } else {
      y += this.gapY;
    }

    // Apply edge detection
    if (this.shouldEdgeDetect) {
      const containerRect = this.containerRef?.current?.getBoundingClientRect();
      const containerLeft = containerRect?.left ?? 0;
      const containerWidth =
        containerRect?.width ??
        (typeof window !== "undefined" ? window.innerWidth : 1920);

      const corrected = calculateEdgeCorrectedPosition(
        {
          anchorX: this.anchorPoint.x,
          anchorY: this.anchorPoint.y,
          tooltipWidth: dims.width,
          tooltipHeight: dims.height,
          containerLeft,
          containerWidth,
          isTouch: this.isTouch,
        },
        {
          gapX: this.gapX,
          gapY: this.gapY,
          touchOffsetY: this.touchOffsetValue,
        },
      );

      return corrected;
    }

    return { x, y, placement: "right" };
  }
}
