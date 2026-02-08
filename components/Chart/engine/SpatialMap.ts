/**
 * SpatialMap
 *
 * The "Hybrid Radar" that finds interaction candidates.
 * Combines DOM-based hit testing with Quadtree spatial queries.
 */

import { Quadtree, quadtree } from "d3-quadtree";

import { CandidateType, InteractionCandidate } from "./types";

// =============================================================================
// DATA ATTRIBUTES (For DOM Element Tagging)
// =============================================================================

/**
 * Standard data attributes used to tag interactive DOM elements.
 * These are read by the SpatialMap during DOM-based hit testing.
 */
export const CHART_DATA_ATTRS = {
  TYPE: "data-chart-type",
  SERIES_ID: "data-chart-series",
  INDEX: "data-chart-index",
  DRAGGABLE: "data-chart-draggable",
} as const;

// =============================================================================
// INDEXED POINT (For Quadtree)
// =============================================================================

/**
 * A point that has been indexed in the Quadtree.
 * This is stored in memory for fast spatial queries.
 */
export interface IndexedPoint<T = unknown> {
  x: number;
  y: number;
  data: T;
  seriesId: string;
  dataIndex: number;
  seriesColor?: string;
  draggable?: boolean;
  suppressMarker?: boolean;
}

// =============================================================================
// SPATIAL MAP CLASS
// =============================================================================

export interface SpatialMapOptions {
  /**
   * The radius (in pixels) for "magnetic" snapping to data points.
   * Points within this radius will be returned as candidates.
   * @default 20
   */
  magneticRadius?: number;

  /**
   * Whether to use DOM-based hit testing (elementsFromPoint).
   * Disable for unit testing without a DOM.
   * @default true
   */
  useDomHitTesting?: boolean;
}

/**
 * SpatialMap provides the "Hybrid Radar" for finding interaction targets.
 *
 * It combines two strategies:
 * 1. **DOM Hit Testing (Broad Phase):** Uses `elementsFromPoint` to find
 *    large, complex shapes (bars, areas, labels) accurately.
 * 2. **Quadtree (Fine Phase):** Uses a spatial tree to find nearby data
 *    points with "magnetic" snapping (great for scatter/line charts).
 */
export class SpatialMap<T = unknown> {
  private tree: Quadtree<IndexedPoint<T>> | null = null;
  private points: IndexedPoint<T>[] = [];
  private containerElement: Element | null = null;
  private options: Required<SpatialMapOptions>;

  constructor(options: SpatialMapOptions = {}) {
    this.options = {
      magneticRadius: options.magneticRadius ?? 40,
      useDomHitTesting: options.useDomHitTesting ?? true,
    };
  }

  /**
   * Set the container element for DOM-based hit testing.
   * Elements outside this container are ignored.
   */
  setContainer(element: Element | null): void {
    this.containerElement = element;
  }

  /**
   * Update the spatial index with new data points.
   * Call this when data changes.
   *
   * @param points - The data points with their pixel coordinates
   */
  updateIndex(points: IndexedPoint<T>[]): void {
    this.points = points;

    if (points.length === 0) {
      this.tree = null;
      return;
    }

    // Build the Quadtree
    this.tree = quadtree<IndexedPoint<T>>()
      .x((d) => d.x)
      .y((d) => d.y)
      .addAll(points);
  }

  /**
   * Clear the spatial index.
   */
  clear(): void {
    this.points = [];
    this.tree = null;
  }

  /**
   * Find all interaction candidates near a point.
   *
   * @param x - X coordinate (relative to plot area for Quadtree)
   * @param y - Y coordinate (relative to plot area for Quadtree)
   * @param containerPoint - Optional container-relative coordinates for DOM hit testing
   * @returns Sorted array of candidates (closest first)
   */
  find(
    x: number,
    y: number,
    containerPoint?: { x: number; y: number },
  ): InteractionCandidate<T>[] {
    const candidates: InteractionCandidate<T>[] = [];

    // Phase 1: DOM Hit Testing (Broad Phase)
    if (this.options.useDomHitTesting) {
      // Use container coordinates if available, otherwise assume x/y are container-relative
      // (This fallback retains backward compatibility but might be wrong if x/y are plot-relative)
      const domX = containerPoint ? containerPoint.x : x;
      const domY = containerPoint ? containerPoint.y : y;
      const domCandidates = this.findFromDOM(domX, domY);
      candidates.push(...domCandidates);
    }

    // Phase 2: Quadtree (Fine Phase)
    const treeCandidates = this.findFromTree(x, y);
    candidates.push(...treeCandidates);

    // Sort by distance (closest first), then by z-index
    candidates.sort((a, b) => {
      // Z-index takes precedence (higher = more important)
      const zDiff = (b.zIndex ?? 0) - (a.zIndex ?? 0);
      if (zDiff !== 0) {
        return zDiff;
      }

      // Then sort by distance
      return a.distance - b.distance;
    });

    return candidates;
  }

  /**
   * Find candidates using DOM elementsFromPoint.
   */
  private findFromDOM(x: number, y: number): InteractionCandidate<T>[] {
    if (!this.containerElement) {
      return [];
    }

    // Convert container-relative to viewport coordinates
    const rect = this.containerElement.getBoundingClientRect();
    const viewportX = rect.left + x;
    const viewportY = rect.top + y;

    // Get all elements at this point
    const elements = document.elementsFromPoint(viewportX, viewportY);
    const candidates: InteractionCandidate<T>[] = [];

    for (const element of elements) {
      // Stop if we've left the container
      if (!this.containerElement.contains(element)) {
        continue;
      }

      // Check for chart data attributes
      const chartType = element.getAttribute(CHART_DATA_ATTRS.TYPE);
      if (!chartType) {
        continue;
      }

      // Hydrate the element into a candidate
      const candidate = this.hydrateElement(element, chartType, x, y);
      if (candidate) {
        candidates.push(candidate);
      }
    }

    return candidates;
  }

  /**
   * Convert a DOM element into an InteractionCandidate.
   */
  private hydrateElement(
    element: Element,
    type: string,
    pointerX: number,
    pointerY: number,
  ): InteractionCandidate<T> | null {
    const seriesId =
      element.getAttribute(CHART_DATA_ATTRS.SERIES_ID) ?? undefined;
    const indexStr = element.getAttribute(CHART_DATA_ATTRS.INDEX);
    const draggable =
      element.getAttribute(CHART_DATA_ATTRS.DRAGGABLE) === "true";

    // Get element center for distance calculation
    const rect = element.getBoundingClientRect();
    const containerRect = this.containerElement?.getBoundingClientRect();
    if (!containerRect) {
      return null;
    }

    const elementCenterX = rect.left + rect.width / 2 - containerRect.left;
    const elementCenterY = rect.top + rect.height / 2 - containerRect.top;

    const distance = Math.hypot(
      pointerX - elementCenterX,
      pointerY - elementCenterY,
    );

    // Try to find the actual data from our indexed points
    let data: T | undefined;
    let dataIndex: number | undefined;

    if (indexStr !== null && seriesId) {
      dataIndex = parseInt(indexStr, 10);
      const point = this.points.find(
        (p) => p.seriesId === seriesId && p.dataIndex === dataIndex,
      );
      if (point) {
        data = point.data;
      }
    }

    // Determine z-index before returning, as we might need it for sorting even if data is missing (though we return null now)
    const zIndex = parseZIndex(element);

    if (!data) {
      return null;
    }

    return {
      type: type as CandidateType,
      data,
      seriesId,
      dataIndex,
      coordinate: { x: elementCenterX, y: elementCenterY },
      distance,
      element,
      draggable,
      zIndex,
    };
  }

  /**
   * Find candidates using the Quadtree (nearby data points).
   */
  private findFromTree(x: number, y: number): InteractionCandidate<T>[] {
    if (!this.tree) {
      return [];
    }

    const candidates: InteractionCandidate<T>[] = [];
    const radius = this.options.magneticRadius;

    // Search within the magnetic radius
    this.tree.visit((node, x0, y0, x1, y1) => {
      // Skip if this quadrant is completely outside the search radius
      if (
        x0 > x + radius ||
        x1 < x - radius ||
        y0 > y + radius ||
        y1 < y - radius
      ) {
        return true; // Skip this branch
      }

      // Check leaf nodes (actual points)
      // Leaf nodes don't have the 'length' property defined
      if (!("length" in node)) {
        // This is a leaf node - iterate through linked list
        type LeafNode = typeof node;
        let current: LeafNode | undefined = node;
        while (current) {
          const point = current.data;
          if (point) {
            const distance = Math.hypot(point.x - x, point.y - y);
            if (distance <= radius) {
              candidates.push({
                type: "data-point",
                data: point.data,
                seriesId: point.seriesId,
                dataIndex: point.dataIndex,
                coordinate: { x: point.x, y: point.y },
                distance,
                seriesColor: point.seriesColor,
                draggable: point.draggable,
                suppressMarker: point.suppressMarker,
              });
            }
          }
          current = current.next;
        }
      }

      return false; // Continue visiting
    });

    return candidates;
  }

  /**
   * Get the current options.
   */
  getOptions(): Required<SpatialMapOptions> {
    return { ...this.options };
  }
}

/**
 * Parse the z-index from an element's computed style.
 */
function parseZIndex(element: Element): number {
  const style = getComputedStyle(element);
  const zIndex = parseInt(style.zIndex, 10);
  return isNaN(zIndex) ? 0 : zIndex;
}
