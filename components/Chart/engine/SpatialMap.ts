/**
 * SpatialMap
 *
 * The "Hybrid Radar" that finds interaction candidates.
 * Combines DOM-based hit testing with Quadtree spatial queries.
 */

import { Quadtree, quadtree } from "d3-quadtree";

import { getElementScale } from "../utils/elementScale";
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
  /** Position in the chart SVG coordinate system, including plot margins. */
  x: number;
  y: number;
  data: T;
  seriesId: string;
  dataIndex: number;
  seriesColor?: string;
  draggable?: boolean;
  suppressMarker?: boolean;
  sliceAxis?: "x" | "y";
}

// =============================================================================
// SPATIAL MAP CLASS
// =============================================================================

export interface GeometryRegistration<T = unknown> {
  update(points: IndexedPoint<T>[]): void;
  dispose(): void;
}

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
  private owners = new Map<symbol, SpatialMap<T>>();
  private geometryOwners = new WeakMap<object, SpatialMap<T> | null>();
  private geometryOwner?: object;
  private plotElement: Element | null = null;
  private sortedX: number[] = [];
  private xBuckets: Map<number, IndexedPoint<T>[]> = new Map();
  private yBuckets: Map<number, IndexedPoint<T>[]> = new Map();
  private identities = new Map<string, Map<number, IndexedPoint<T>>>();
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
  setContainer(
    element: Element | null,
    plotElement: Element | null = null,
  ): void {
    this.containerElement = element;
    this.plotElement = plotElement;
  }

  /**
   * Update the spatial index with new data points.
   * Call this when data changes.
   *
   * @param points - The data points with their pixel coordinates
   */
  updateIndex(points: IndexedPoint<T>[]): void {
    this.sortedX = [];
    this.yBuckets.clear();
    this.identities.clear();

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
      const identities =
        this.identities.get(p.seriesId) ?? new Map<number, IndexedPoint<T>>();
      identities.set(p.dataIndex, p);
      this.identities.set(p.seriesId, identities);
      const buckets = p.sliceAxis === "y" ? this.yBuckets : this.xBuckets;
      const coordinate = p.sliceAxis === "y" ? p.y : p.x;
      const bucket = buckets.get(coordinate) ?? [];
      bucket.push(p);
      buckets.set(coordinate, bucket);
    }
    this.sortedX = [...this.xBuckets.keys()].sort((a, b) => a - b);
  }

  /** Each owner has an independent index: moving a handle never scans root marks. */
  registerGeometry(points: IndexedPoint<T>[] = []): GeometryRegistration<T> {
    const owner = Symbol("geometry");
    const index = new SpatialMap<T>({
      ...this.options,
      useDomHitTesting: false,
    });
    const token = Object.freeze({});
    index.geometryOwner = token;
    this.geometryOwners.set(token, index);
    index.updateIndex(points);
    this.owners.set(owner, index);
    return {
      update: (next) => {
        if (this.owners.has(owner)) {
          index.updateIndex(next);
        }
      },
      dispose: () => {
        this.owners.delete(owner);
        this.geometryOwners.set(token, null);
      },
    };
  }

  // Later registrations win identity collisions, independently of update order.
  private lookupPoint(
    seriesId: string,
    dataIndex: number,
  ): IndexedPoint<T> | undefined {
    const owners = Array.from(this.owners.values());
    for (let i = owners.length - 1; i >= 0; i--) {
      const point = owners[i].identities.get(seriesId)?.get(dataIndex);
      if (point) {
        return point;
      }
    }
    return this.identities.get(seriesId)?.get(dataIndex);
  }

  private getGeometryOwner(point: IndexedPoint<T>): object | undefined {
    if (this.geometryOwner) {
      return this.geometryOwner;
    }
    const owners = [...this.owners.values()];
    for (let i = owners.length - 1; i >= 0; i--) {
      if (
        owners[i].identities.get(point.seriesId)?.get(point.dataIndex) === point
      ) {
        return owners[i].geometryOwner;
      }
    }
    return undefined;
  }

  private isVisible = (point: IndexedPoint<T>): boolean =>
    this.lookupPoint(point.seriesId, point.dataIndex) === point;

  private slicePoints(axis: "x" | "y", coordinate: number): IndexedPoint<T>[] {
    return [this, ...this.owners.values()].flatMap((index) =>
      (
        (axis === "y" ? index.yBuckets : index.xBuckets).get(coordinate) ?? []
      ).filter(this.isVisible),
    );
  }

  /**
   * Clear the spatial index.
   */
  clear(): void {
    this.owners.clear();
    this.geometryOwners = new WeakMap();
    this.sortedX = [];
    this.yBuckets.clear();
    this.identities.clear();
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
    const bucket = this.slicePoints("x", x);
    return bucket.map((p) => ({
      type: "data-point" as CandidateType,
      data: p.data,
      geometryOwner: this.getGeometryOwner(p),
      seriesId: p.seriesId,
      dataIndex: p.dataIndex,
      coordinate: { x: p.x, y: p.y },
      distance: 0,
      seriesColor: p.seriesColor,
      draggable: p.draggable,
      suppressMarker: p.suppressMarker,
    }));
  }

  resolveTarget(
    seriesId: string,
    dataIndex: number,
    geometryOwner?: object,
  ): InteractionCandidate<T> | null | undefined {
    const owned = geometryOwner
      ? this.geometryOwners.get(geometryOwner)
      : undefined;
    const point = geometryOwner
      ? owned?.identities.get(seriesId)?.get(dataIndex)
      : this.lookupPoint(seriesId, dataIndex);
    if (geometryOwner && !point) {
      return null;
    }
    if (point) {
      const token = geometryOwner ?? this.getGeometryOwner(point);
      if (!token) {
        return undefined;
      }
      return {
        type: "data-point",
        data: point.data,
        seriesId,
        dataIndex,
        geometryOwner: token,
        coordinate: { x: point.x, y: point.y },
        distance: 0,
        seriesColor: point.seriesColor,
        suppressMarker: point.suppressMarker,
        draggable: point.draggable,
      };
    }
    if (!this.containerElement) {
      return null;
    }
    for (const element of this.containerElement.querySelectorAll(
      `[${CHART_DATA_ATTRS.TYPE}]`,
    )) {
      if (
        element.getAttribute(CHART_DATA_ATTRS.SERIES_ID) !== seriesId ||
        element.getAttribute(CHART_DATA_ATTRS.INDEX) !== String(dataIndex)
      ) {
        continue;
      }
      return this.hydrateElement(
        element,
        element.getAttribute(CHART_DATA_ATTRS.TYPE)!,
        0,
        0,
      );
    }
    return null;
  }

  findSlice(candidate: InteractionCandidate<T>): InteractionCandidate<T>[] {
    const point =
      candidate.seriesId !== undefined && candidate.dataIndex !== undefined
        ? this.lookupPoint(candidate.seriesId, candidate.dataIndex)
        : undefined;
    if (!point) {
      if (!candidate.element) {
        return this.findAllAtX(candidate.coordinate.x);
      }
      // DOM rectangles round subpixel centers; match only the adjacent X bucket,
      // not a magnetic radius that could pull in a different category.
      const peers = [this, ...this.owners.values()].flatMap((index) => {
        const xs = index.sortedX;
        const x = candidate.coordinate.x;
        let low = 0;
        let high = xs.length;
        while (low < high) {
          const mid = (low + high) >>> 1;
          if (xs[mid] < x) {
            low = mid + 1;
          } else {
            high = mid;
          }
        }
        const closest = [xs[low - 1], xs[low]]
          .filter((value): value is number => value !== undefined)
          .sort((a, b) => Math.abs(a - x) - Math.abs(b - x))[0];
        return closest !== undefined && Math.abs(closest - x) <= 0.5
          ? index
              .findAllAtX(closest)
              .filter(
                (peer) =>
                  peer.seriesId !== undefined &&
                  peer.dataIndex !== undefined &&
                  this.lookupPoint(peer.seriesId, peer.dataIndex) ===
                    index.identities.get(peer.seriesId)?.get(peer.dataIndex),
              )
          : [];
      });
      return [
        candidate,
        ...peers.filter(
          (peer) =>
            !(
              peer.seriesId === candidate.seriesId &&
              peer.dataIndex === candidate.dataIndex
            ),
        ),
      ];
    }
    const bucket = this.slicePoints(
      point.sliceAxis ?? "x",
      point.sliceAxis === "y" ? point.y : point.x,
    );
    return (bucket ?? []).map((p) => ({
      type: "data-point",
      data: p.data,
      geometryOwner: this.getGeometryOwner(p),
      seriesId: p.seriesId,
      dataIndex: p.dataIndex,
      coordinate: { x: p.x, y: p.y },
      distance: 0,
      seriesColor: p.seriesColor,
      suppressMarker: p.suppressMarker,
      draggable: p.draggable,
    }));
  }

  /**
   * Find all interaction candidates near a point.
   *
   * @param x - X coordinate in the chart SVG
   * @param y - Y coordinate in the chart SVG
   * @param containerPoint - Optional container-relative coordinates for DOM hit testing
   * @returns DOM hits in stacking order, followed by nearest indexed points
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
    const treeCandidates = [this, ...this.owners.values()].flatMap((index) =>
      index.findFromTree(x, y, this.isVisible),
    );
    candidates.push(...treeCandidates);

    candidates.sort((a, b) => {
      const zDiff = (b.zIndex ?? 0) - (a.zIndex ?? 0);
      if (zDiff !== 0) {
        return zDiff;
      }
      if (a.element && b.element) {
        return 0;
      }
      if (a.element) {
        return -1;
      }
      if (b.element) {
        return 1;
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
    const scale = getElementScale(this.containerElement, rect);
    const style = getComputedStyle(this.containerElement);
    const viewportX =
      rect.left + (x + (parseFloat(style.borderLeftWidth) || 0)) * scale.x;
    const viewportY =
      rect.top + (y + (parseFloat(style.borderTopWidth) || 0)) * scale.y;

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
    const draggableAttribute = element.getAttribute(CHART_DATA_ATTRS.DRAGGABLE);

    const rect = element.getBoundingClientRect();
    const containerRect = this.containerElement?.getBoundingClientRect();
    if (!containerRect) {
      return null;
    }

    const scale = getElementScale(this.containerElement, containerRect);
    const style = getComputedStyle(this.containerElement!);
    const elementCenterX =
      (rect.left + rect.width / 2 - containerRect.left) / scale.x -
      (parseFloat(style.borderLeftWidth) || 0);
    const elementCenterY =
      (rect.top + rect.height / 2 - containerRect.top) / scale.y -
      (parseFloat(style.borderTopWidth) || 0);

    const distance = Math.hypot(
      pointerX - elementCenterX,
      pointerY - elementCenterY,
    );

    let indexed: IndexedPoint<T> | undefined;
    let data: T | undefined;
    let dataIndex: number | undefined;

    if (indexStr !== null && seriesId) {
      dataIndex = parseInt(indexStr, 10);
      indexed = this.lookupPoint(seriesId, dataIndex);
      data = indexed?.data;
    }

    // Fall back to D3's __data__ binding for custom renders that don't index their points
    if (data === undefined) {
      const d3Data = (element as Element & { __data__?: T }).__data__;
      if (d3Data !== undefined && !Array.isArray(d3Data)) {
        data = d3Data as T;
      }
    }

    const plotRect = this.plotElement?.getBoundingClientRect();
    const offsetX = plotRect
      ? (plotRect.left - containerRect.left) / scale.x -
        (parseFloat(style.borderLeftWidth) || 0)
      : 0;
    const offsetY = plotRect
      ? (plotRect.top - containerRect.top) / scale.y -
        (parseFloat(style.borderTopWidth) || 0)
      : 0;
    const zIndex = parseZIndex(element);

    if (data === undefined) {
      return null;
    }

    return {
      type: type as CandidateType,
      data,
      seriesId,
      dataIndex,
      coordinate: { x: elementCenterX - offsetX, y: elementCenterY - offsetY },
      distance,
      element,
      geometryOwner: indexed ? this.getGeometryOwner(indexed) : undefined,
      seriesColor: indexed?.seriesColor,
      suppressMarker: indexed?.suppressMarker,
      draggable:
        draggableAttribute === null
          ? indexed?.draggable
          : draggableAttribute === "true",
      zIndex,
    };
  }

  /**
   * Find candidates using the Quadtree (nearby data points).
   */
  private findFromTree(
    x: number,
    y: number,
    isVisible: (point: IndexedPoint<T>) => boolean,
  ): InteractionCandidate<T>[] {
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
          if (point && isVisible(point)) {
            const distance = Math.hypot(point.x - x, point.y - y);
            if (distance <= radius) {
              candidates.push({
                type: "data-point",
                data: point.data,
                geometryOwner: this.geometryOwner,
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
