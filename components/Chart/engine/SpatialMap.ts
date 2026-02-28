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
  private xBuckets: Map<number, IndexedPoint<T>[]> = new Map();
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
      this.xBuckets = new Map();
      return;
    }

    this.tree = quadtree<IndexedPoint<T>>()
      .x((d) => d.x)
      .y((d) => d.y)
      .addAll(points);

    // Build the X-bucket index for O(k) vertical-slice lookups
    this.xBuckets = new Map();
    for (const p of points) {
      const bucket = this.xBuckets.get(p.x) ?? [];
      bucket.push(p);
      this.xBuckets.set(p.x, bucket);
    }
  }

  /**
   * Clear the spatial index.
   */
  clear(): void {
    this.points = [];
    this.tree = null;
    this.xBuckets = new Map();
  }

  /**
   * Find all indexed points sharing the given X coordinate (O(k) bucket lookup).
   * Returns every point at that X regardless of Y distance — intended for
   * multi-series vertical-slice hover.
   *
   * @param x - The exact X pixel coordinate (as stored in the index)
   */
  findAllAtX(x: number): InteractionCandidate<T>[] {
    const bucket = this.xBuckets.get(x) ?? [];
    return bucket.map((p) => ({
      type: "data-point" as CandidateType,
      data: p.data,
      seriesId: p.seriesId,
      dataIndex: p.dataIndex,
      coordinate: { x: p.x, y: p.y },
      distance: 0,
      seriesColor: p.seriesColor,
      draggable: p.draggable,
      suppressMarker: p.suppressMarker,
    }));
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

    candidates.sort((a, b) => {
      const zDiff = (b.zIndex ?? 0) - (a.zIndex ?? 0);
      if (zDiff !== 0) {
        return zDiff;
      }
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

    const rect = this.containerElement.getBoundingClientRect();
    const viewportX = rect.left + x;
    const viewportY = rect.top + y;

    const elements = document.elementsFromPoint(viewportX, viewportY);
    const candidates: InteractionCandidate<T>[] = [];

    for (const element of elements) {
      if (!this.containerElement.contains(element)) {
        continue;
      }

      const chartType = element.getAttribute(CHART_DATA_ATTRS.TYPE);
      if (!chartType) {
        continue;
      }

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

    // Fall back to D3's __data__ binding for custom renders that don't index their points
    if (!data) {
      const d3Data = (element as any).__data__;
      if (d3Data && !Array.isArray(d3Data)) {
        data = d3Data as T;
      }
    }

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

    this.tree.visit((node, x0, y0, x1, y1) => {
      if (
        x0 > x + radius ||
        x1 < x - radius ||
        y0 > y + radius ||
        y1 < y - radius
      ) {
        return true; // Skip this branch
      }

      // Leaf nodes don't have the 'length' property defined
      if (!("length" in node)) {
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
