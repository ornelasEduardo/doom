/**
 * SpatialMap
 *
 * The "Hybrid Radar" that finds interaction candidates.
 * Combines DOM-based hit testing with Quadtree spatial queries.
 */
import { Quadtree, quadtree } from "d3-quadtree";

import { getElementScale } from "../utils/elementScale";
import {
  type GridBuffers,
  type PointSource,
  PreparedGrid,
} from "./PreparedGrid";
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
  /** Position in owner index coordinates; defaults to SVG coordinates including plot margins. */
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

export interface GeometryViewport {
  scaleX: number;
  scaleY: number;
  translateX: number;
  translateY: number;
  /** Visible rectangle in SVG coordinates. */
  clip?: { x: number; y: number; width: number; height: number };
}

export interface GeometryRegistration<T = unknown> {
  /** Snapshot numeric buffers and point slots once; patches and viewport changes retain that ownership. */
  updatePrepared(
    points: IndexedPoint<T>[] | PointSource<T>,
    grid: GridBuffers,
    viewport: GeometryViewport,
  ): void;
  /** Replace existing identities in one batch without rebuilding the owner index. */
  patch(points: IndexedPoint<T>[]): void;
  /** Positive axis-aligned projection; updates queries without rebuilding the index. */
  setViewport(viewport: GeometryViewport | undefined): void;
  /** Optional viewport is published with the replacement points; null restores SVG coordinates. */
  update(points: IndexedPoint<T>[], viewport?: GeometryViewport | null): void;
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
  private viewport?: GeometryViewport;
  private grid?: PreparedGrid<T>;
  private sortedY: number[] = [];
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
    this.grid = undefined;
    this.sortedX = [];
    this.sortedY = [];
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
    this.sortedY = [...this.yBuckets.keys()].sort((a, b) => a - b);
  }

  private patchIndex(points: IndexedPoint<T>[]): void {
    if (this.grid) {
      this.grid.patch(points);
      return;
    }
    const changes = new Map<string, Map<number, IndexedPoint<T>>>();
    for (const point of points) {
      if (
        !this.identities.get(point.seriesId)?.has(point.dataIndex) ||
        !Number.isFinite(point.x) ||
        !Number.isFinite(point.y)
      ) {
        throw new RangeError(
          "Geometry patches require existing identities and finite coordinates",
        );
      }
      const rows =
        changes.get(point.seriesId) ?? new Map<number, IndexedPoint<T>>();
      rows.set(point.dataIndex, point);
      changes.set(point.seriesId, rows);
    }
    const changeBucket = (point: IndexedPoint<T>, add: boolean) => {
      const vertical = point.sliceAxis === "y";
      const buckets = vertical ? this.yBuckets : this.xBuckets;
      const sorted = vertical ? this.sortedY : this.sortedX;
      const coordinate = vertical ? point.y : point.x;
      const bucket = buckets.get(coordinate);
      if (add && bucket) {
        bucket.push(point);
        return;
      }
      if (!add && bucket && bucket.length > 1) {
        bucket.splice(bucket.indexOf(point), 1);
        return;
      }
      let low = 0,
        high = sorted.length;
      while (low < high) {
        const middle = (low + high) >>> 1;
        if (sorted[middle] < coordinate) {
          low = middle + 1;
        } else {
          high = middle;
        }
      }
      if (add) {
        buckets.set(coordinate, [point]);
        sorted.splice(low, 0, coordinate);
      } else {
        buckets.delete(coordinate);
        sorted.splice(low, 1);
      }
    };
    for (const [seriesId, rows] of changes) {
      for (const [dataIndex, point] of rows) {
        const previous = this.identities.get(seriesId)!.get(dataIndex)!;
        this.tree!.remove(previous);
        const axis = point.sliceAxis ?? "x";
        if (
          axis === (previous.sliceAxis ?? "x") &&
          point[axis] === previous[axis]
        ) {
          const bucket = (axis === "x" ? this.xBuckets : this.yBuckets).get(
            point[axis],
          )!;
          bucket[bucket.indexOf(previous)] = point;
        } else {
          changeBucket(previous, false);
          changeBucket(point, true);
        }
        this.identities.get(seriesId)!.set(dataIndex, point);
        this.tree!.add(point);
      }
    }
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
    const setViewport = (viewport: GeometryViewport | undefined) => {
      if (!this.owners.has(owner)) {
        return;
      }
      if (
        viewport &&
        (!Number.isFinite(viewport.scaleX) ||
          viewport.scaleX <= 0 ||
          !Number.isFinite(viewport.scaleY) ||
          viewport.scaleY <= 0 ||
          !Number.isFinite(viewport.translateX) ||
          !Number.isFinite(viewport.translateY) ||
          (viewport.clip &&
            (!Object.values(viewport.clip).every(Number.isFinite) ||
              viewport.clip.width < 0 ||
              viewport.clip.height < 0)))
      ) {
        throw new RangeError(
          "Geometry viewport requires finite positive scales and a valid clip rectangle",
        );
      }
      index.viewport = viewport
        ? {
            ...viewport,
            clip: viewport.clip ? { ...viewport.clip } : undefined,
          }
        : undefined;
    };
    return {
      updatePrepared: (points, buffers, viewport) => {
        if (!this.owners.has(owner)) {
          return;
        }
        const grid = new PreparedGrid(points, buffers);
        setViewport(viewport);
        index.updateIndex([]);
        index.grid = grid;
      },
      patch: (points) => {
        if (this.owners.has(owner)) {
          index.patchIndex(points);
        }
      },
      setViewport,
      update: (next, viewport) => {
        if (this.owners.has(owner)) {
          if (viewport !== undefined) {
            setViewport(viewport ?? undefined);
          }
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
      const point = owners[i].ownPoint(seriesId, dataIndex);
      if (point) {
        return point;
      }
    }
    return this.ownPoint(seriesId, dataIndex);
  }

  private ownPoint(
    seriesId: string,
    dataIndex: number,
  ): IndexedPoint<T> | undefined {
    return (
      this.grid?.get(seriesId, dataIndex) ??
      this.identities.get(seriesId)?.get(dataIndex)
    );
  }

  private ownsIdentity(seriesId: string, dataIndex: number): boolean {
    return (
      this.grid?.has(seriesId, dataIndex) ??
      this.identities.get(seriesId)?.has(dataIndex) ??
      false
    );
  }

  private unindexedKeyboardTargets(owners: SpatialMap<T>[]) {
    const targets = new Map<IndexedPoint<T>, InteractionCandidate<T>>();
    const seen = new Map<string, Set<number>>();
    for (const element of this.containerElement?.querySelectorAll(
      `[${CHART_DATA_ATTRS.TYPE}]`,
    ) ?? []) {
      const seriesId = element.getAttribute(CHART_DATA_ATTRS.SERIES_ID);
      const index = element.getAttribute(CHART_DATA_ATTRS.INDEX);
      if (seriesId === null || index === null) {
        continue;
      }
      const dataIndex = Number(index);
      if (
        !Number.isInteger(dataIndex) ||
        dataIndex < 0 ||
        seen.get(seriesId)?.has(dataIndex) ||
        owners.some((owner) => owner.ownsIdentity(seriesId, dataIndex))
      ) {
        continue;
      }
      const candidate = this.hydrateElement(
        element,
        element.getAttribute(CHART_DATA_ATTRS.TYPE)!,
        0,
        0,
      );
      if (!candidate || candidate.data === undefined) {
        continue;
      }
      const indices = seen.get(seriesId) ?? new Set<number>();
      indices.add(dataIndex);
      seen.set(seriesId, indices);
      targets.set(
        { ...candidate.coordinate, seriesId, dataIndex, data: candidate.data },
        candidate,
      );
    }
    return targets;
  }

  private keyboardTarget(
    point: IndexedPoint<T>,
    coordinate: { x: number; y: number },
  ): InteractionCandidate<T> {
    return {
      type: "data-point",
      data: point.data,
      seriesId: point.seriesId,
      dataIndex: point.dataIndex,
      geometryOwner: this.geometryOwner,
      coordinate,
      distance: 0,
      seriesColor: point.seriesColor,
      suppressMarker: point.suppressMarker,
      draggable: point.draggable,
    };
  }

  private ordinaryKeyboardSlices(
    owners: SpatialMap<T>[],
    visible: (
      ownerIndex: number,
      seriesId: string,
      dataIndex: number,
    ) => boolean,
  ) {
    const ordinary = owners.map((owner) =>
      owner.grid
        ? owner.grid.lazy
          ? []
          : Array.from({ length: owner.grid.length }, (_, i) =>
              owner.grid!.at(i),
            )
        : [...owner.identities.values()].flatMap((series) => [
            ...series.values(),
          ]),
    );
    const domTargets = this.unindexedKeyboardTargets(owners);
    ordinary[0].push(...domTargets.keys());
    const slices = new Map<string, InteractionCandidate<T>[]>();
    const leaders = new Map<IndexedPoint<T>, InteractionCandidate<T>[]>();
    ordinary.forEach((points, ownerIndex) => {
      const owner = owners[ownerIndex];
      for (const point of points) {
        if (!visible(ownerIndex, point.seriesId, point.dataIndex)) {
          continue;
        }
        const coordinate = owner.project(point);
        if (!coordinate) {
          continue;
        }
        const axis = point.sliceAxis ?? "x";
        const key = `${axis}:${coordinate[axis]}`;
        let slice = slices.get(key);
        if (!slice) {
          slice = [];
          slices.set(key, slice);
          leaders.set(point, slice);
        }
        slice.push(
          domTargets.get(point) ?? owner.keyboardTarget(point, coordinate),
        );
      }
    });
    return { ordinary, leaders };
  }

  /** Traverse ordinary slices and lazy rows in registration order without expanding lazy sources. */
  navigateCompact(
    current: Pick<
      InteractionCandidate<T>,
      "seriesId" | "dataIndex" | "geometryOwner"
    > | null,
    direction: 1 | -1,
  ): InteractionCandidate<T>[] | null | undefined {
    const owners = [this, ...this.owners.values()];
    if (!owners.some((owner) => owner.grid?.lazy)) {
      return undefined;
    }
    const visible = (
      ownerIndex: number,
      seriesId: string,
      dataIndex: number,
    ) => {
      for (let i = ownerIndex + 1; i < owners.length; i++) {
        const owner = owners[i];
        if (owner.ownsIdentity(seriesId, dataIndex)) {
          return false;
        }
      }
      return true;
    };
    const { ordinary, leaders } = this.ordinaryKeyboardSlices(owners, visible);
    const currentOwner = current
      ? owners.findIndex(
          (owner) => owner.geometryOwner === current.geometryOwner,
        )
      : -1;
    const currentRow =
      currentOwner < 0
        ? -1
        : owners[currentOwner].grid?.lazy &&
            owners[currentOwner].grid?.has(
              current!.seriesId!,
              current!.dataIndex!,
            )
          ? current!.dataIndex!
          : ordinary[currentOwner].findIndex(
              (point) =>
                point.seriesId === current!.seriesId &&
                point.dataIndex === current!.dataIndex,
            );
    const validCursor = currentOwner >= 0 && currentRow >= 0;
    const candidate = (ownerIndex: number, row: number) => {
      const owner = owners[ownerIndex],
        grid = owner.grid;
      if (!grid?.lazy) {
        return leaders.get(ordinary[ownerIndex][row]) ?? null;
      }
      if (!visible(ownerIndex, grid.seriesId!, row)) {
        return null;
      }
      const coordinate = owner.project(grid.coordinate(row));
      return coordinate
        ? [owner.keyboardTarget(grid.at(row), coordinate)]
        : null;
    };
    // A missing/disposed cursor starts at the first target, like ordinary keyboard navigation.
    const step = validCursor ? direction : 1;
    for (
      let i = validCursor ? currentOwner : 0;
      i >= 0 && i < owners.length;
      i += step
    ) {
      const length = owners[i].grid?.lazy
        ? owners[i].grid!.length
        : ordinary[i].length;
      const start =
        validCursor && i === currentOwner
          ? currentRow + step
          : step === 1
            ? 0
            : length - 1;
      for (let row = start; row >= 0 && row < length; row += step) {
        const slice = candidate(i, row);
        if (slice) {
          return slice;
        }
      }
    }
    return validCursor ? candidate(currentOwner, currentRow) : null;
  }

  private getGeometryOwner(point: IndexedPoint<T>): object | undefined {
    if (this.geometryOwner) {
      return this.geometryOwner;
    }
    const owners = [...this.owners.values()];
    for (let i = owners.length - 1; i >= 0; i--) {
      if (owners[i].ownPoint(point.seriesId, point.dataIndex) === point) {
        return owners[i].geometryOwner;
      }
    }
    return undefined;
  }

  private isVisible = (point: IndexedPoint<T>): boolean =>
    this.lookupPoint(point.seriesId, point.dataIndex) === point;

  private screenAxis(axis: "x" | "y", value: number): number {
    const v = this.viewport;
    return v
      ? value * (axis === "x" ? v.scaleX : v.scaleY) +
          (axis === "x" ? v.translateX : v.translateY)
      : value;
  }

  private project(point: {
    x: number;
    y: number;
  }): { x: number; y: number } | null {
    const coordinate = {
      x: this.screenAxis("x", point.x),
      y: this.screenAxis("y", point.y),
    };
    const clip = this.viewport?.clip;
    return !Number.isFinite(coordinate.x) ||
      !Number.isFinite(coordinate.y) ||
      (clip &&
        (coordinate.x < clip.x ||
          coordinate.y < clip.y ||
          coordinate.x > clip.x + clip.width ||
          coordinate.y > clip.y + clip.height))
      ? null
      : coordinate;
  }

  private coordinates(point: IndexedPoint<T>): { x: number; y: number } | null {
    const token = this.getGeometryOwner(point);
    return (token ? (this.geometryOwners.get(token) ?? this) : this).project(
      point,
    );
  }

  private slicePoints(axis: "x" | "y", coordinate: number): IndexedPoint<T>[] {
    return [this, ...this.owners.values()].flatMap((index) => {
      if (index.grid) {
        const scale =
          axis === "x"
            ? (index.viewport?.scaleX ?? 1)
            : (index.viewport?.scaleY ?? 1);
        const translation =
          axis === "x"
            ? (index.viewport?.translateX ?? 0)
            : (index.viewport?.translateY ?? 0);
        const value = (coordinate - translation) / scale;
        const tolerance =
          (Number.EPSILON *
            Math.max(1, Math.abs(coordinate), Math.abs(translation)) *
            16) /
          scale;
        const points: IndexedPoint<T>[] = [];
        index.grid.query(
          axis === "x" ? value - tolerance : -Infinity,
          axis === "y" ? value - tolerance : -Infinity,
          axis === "x" ? value + tolerance : Infinity,
          axis === "y" ? value + tolerance : Infinity,
          (point) => {
            if (
              (point.sliceAxis ?? "x") === axis &&
              this.isVisible(point) &&
              index.project(point)
            ) {
              points.push(point);
            }
          },
          (x, y) => index.project({ x, y }) !== null,
        );
        return points;
      }
      const keys = axis === "x" ? index.sortedX : index.sortedY;
      let low = 0,
        high = keys.length;
      while (low < high) {
        const middle = (low + high) >>> 1;
        if (index.screenAxis(axis, keys[middle]) < coordinate) {
          low = middle + 1;
        } else {
          high = middle;
        }
      }
      const key =
        keys[low] !== undefined &&
        index.screenAxis(axis, keys[low]) === coordinate
          ? keys[low]
          : [keys[low - 1], keys[low]].find(
              (value) =>
                value !== undefined &&
                Math.abs(index.screenAxis(axis, value) - coordinate) <=
                  Number.EPSILON * Math.max(1, Math.abs(coordinate)) * 8,
            );
      if (key === undefined) {
        return [];
      }
      return (
        (axis === "x" ? index.xBuckets : index.yBuckets).get(key) ?? []
      ).filter(
        (point) => this.isVisible(point) && index.project(point) !== null,
      );
    });
  }

  /**
   * Clear the spatial index.
   */
  clear(): void {
    this.grid = undefined;
    this.owners.clear();
    this.geometryOwners = new WeakMap();
    this.sortedX = [];
    this.sortedY = [];
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
      coordinate: this.coordinates(p)!,
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
    return this.resolveTargetWithDOM(seriesId, dataIndex, geometryOwner, () => {
      for (const element of this.containerElement?.querySelectorAll(
        `[${CHART_DATA_ATTRS.TYPE}]`,
      ) ?? []) {
        if (
          element.getAttribute(CHART_DATA_ATTRS.SERIES_ID) === seriesId &&
          element.getAttribute(CHART_DATA_ATTRS.INDEX) === String(dataIndex)
        ) {
          return element;
        }
      }
      return undefined;
    });
  }

  /** DOM fallback identities are indexed lazily, for this batch only. */
  resolveTargets(
    targets: readonly Pick<
      InteractionCandidate<T>,
      "seriesId" | "dataIndex" | "geometryOwner"
    >[],
  ): (InteractionCandidate<T> | null | undefined)[] {
    let elements: Map<string, Map<string, Element>> | undefined;
    const findElement = (seriesId: string, dataIndex: number) => {
      if (!elements) {
        elements = new Map();
        for (const element of this.containerElement?.querySelectorAll(
          `[${CHART_DATA_ATTRS.TYPE}]`,
        ) ?? []) {
          const series = element.getAttribute(CHART_DATA_ATTRS.SERIES_ID);
          const index = element.getAttribute(CHART_DATA_ATTRS.INDEX);
          if (series === null || index === null) {
            continue;
          }
          const rows = elements.get(series) ?? new Map<string, Element>();
          if (!rows.has(index)) {
            rows.set(index, element);
          }
          elements.set(series, rows);
        }
      }
      return elements.get(seriesId)?.get(String(dataIndex));
    };
    return targets.map(({ seriesId, dataIndex, geometryOwner }) =>
      seriesId === undefined || dataIndex === undefined
        ? null
        : this.resolveTargetWithDOM(seriesId, dataIndex, geometryOwner, () =>
            findElement(seriesId, dataIndex),
          ),
    );
  }

  private resolveTargetWithDOM(
    seriesId: string,
    dataIndex: number,
    geometryOwner: object | undefined,
    findElement: () => Element | undefined,
  ): InteractionCandidate<T> | null | undefined {
    const owned = geometryOwner
      ? this.geometryOwners.get(geometryOwner)
      : undefined;
    const point = geometryOwner
      ? owned?.ownPoint(seriesId, dataIndex)
      : this.lookupPoint(seriesId, dataIndex);
    if (geometryOwner && !point) {
      return null;
    }
    if (point) {
      const token = geometryOwner ?? this.getGeometryOwner(point);
      if (!token) {
        return undefined;
      }
      const coordinate = this.coordinates(point);
      if (!coordinate) {
        return null;
      }
      return {
        type: "data-point",
        data: point.data,
        seriesId,
        dataIndex,
        geometryOwner: token,
        coordinate,
        distance: 0,
        seriesColor: point.seriesColor,
        suppressMarker: point.suppressMarker,
        draggable: point.draggable,
      };
    }
    const element = findElement();
    return element
      ? this.hydrateElement(
          element,
          element.getAttribute(CHART_DATA_ATTRS.TYPE)!,
          0,
          0,
        )
      : null;
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
          if (index.screenAxis("x", xs[mid]) < x) {
            low = mid + 1;
          } else {
            high = mid;
          }
        }
        const closest = [xs[low - 1], xs[low]]
          .filter((value): value is number => value !== undefined)
          .sort(
            (a, b) =>
              Math.abs(index.screenAxis("x", a) - x) -
              Math.abs(index.screenAxis("x", b) - x),
          )[0];
        return closest !== undefined &&
          Math.abs(index.screenAxis("x", closest) - x) <= 0.5
          ? index
              .findAllAtX(index.screenAxis("x", closest))
              .filter(
                (peer) =>
                  peer.seriesId !== undefined &&
                  peer.dataIndex !== undefined &&
                  this.lookupPoint(peer.seriesId, peer.dataIndex) ===
                    index.ownPoint(peer.seriesId, peer.dataIndex),
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
    const coordinate = this.coordinates(point);
    if (!coordinate) {
      return [];
    }
    const bucket = this.slicePoints(
      point.sliceAxis ?? "x",
      point.sliceAxis === "y" ? coordinate.y : coordinate.x,
    );
    return (bucket ?? []).map((p) => ({
      type: "data-point",
      data: p.data,
      geometryOwner: this.getGeometryOwner(p),
      seriesId: p.seriesId,
      dataIndex: p.dataIndex,
      coordinate: this.coordinates(p)!,
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
    for (const candidate of treeCandidates) {
      candidates.push(candidate);
    }

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
    if (!this.tree && !this.grid) {
      return [];
    }

    const candidates: InteractionCandidate<T>[] = [];
    const radius = this.options.magneticRadius;
    const viewport = this.viewport;
    const queryX = viewport ? (x - viewport.translateX) / viewport.scaleX : x;
    const queryY = viewport ? (y - viewport.translateY) / viewport.scaleY : y;
    const radiusX = radius / (viewport?.scaleX ?? 1);
    const radiusY = radius / (viewport?.scaleY ?? 1);

    if (this.grid) {
      this.grid.query(
        queryX - radiusX,
        queryY - radiusY,
        queryX + radiusX,
        queryY + radiusY,
        (point) => {
          if (!isVisible(point)) {
            return;
          }
          const coordinate = this.project(point);
          if (!coordinate) {
            return;
          }
          const distance = Math.hypot(coordinate.x - x, coordinate.y - y);
          if (distance <= radius) {
            candidates.push({
              type: "data-point",
              data: point.data,
              geometryOwner: this.geometryOwner,
              seriesId: point.seriesId,
              dataIndex: point.dataIndex,
              coordinate,
              distance,
              seriesColor: point.seriesColor,
              draggable: point.draggable,
              suppressMarker: point.suppressMarker,
            });
          }
        },
        (px, py) => {
          const sx = this.screenAxis("x", px),
            sy = this.screenAxis("y", py);
          const clip = viewport?.clip;
          return (
            Number.isFinite(sx) &&
            Number.isFinite(sy) &&
            (!clip ||
              (sx >= clip.x &&
                sy >= clip.y &&
                sx <= clip.x + clip.width &&
                sy <= clip.y + clip.height)) &&
            Math.hypot(sx - x, sy - y) <= radius
          );
        },
      );
      return candidates;
    }
    this.tree!.visit((node, x0, y0, x1, y1) => {
      if (
        x0 > queryX + radiusX ||
        x1 < queryX - radiusX ||
        y0 > queryY + radiusY ||
        y1 < queryY - radiusY
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
            const coordinate = this.project(point);
            const distance = coordinate
              ? Math.hypot(coordinate.x - x, coordinate.y - y)
              : Infinity;
            if (coordinate && distance <= radius) {
              candidates.push({
                type: "data-point",
                data: point.data,
                geometryOwner: this.geometryOwner,
                seriesId: point.seriesId,
                dataIndex: point.dataIndex,
                coordinate,
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
