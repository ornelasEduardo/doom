import type { IndexedPoint } from "./SpatialMap";

export interface PointSource<T> {
  length: number;
  seriesId: string;
  get(index: number): IndexedPoint<T>;
}

export interface GridBuffers {
  coordinates: Float64Array;
  heads: Int32Array;
  next: Int32Array;
  previous: Int32Array;
  cells: number;
  minX: number;
  minY: number;
  width: number;
  height: number;
}
const cell = (value: number, min: number, span: number, cells: number) =>
  Math.max(0, Math.min(cells - 1, Math.floor(((value - min) / span) * cells)));
const slotCell = (g: GridBuffers, index: number) =>
  cell(g.coordinates[index * 2], g.minX, g.width, g.cells) +
  cell(g.coordinates[index * 2 + 1], g.minY, g.height, g.cells) * g.cells;
function insert(g: GridBuffers, index: number) {
  const bucket = slotCell(g, index),
    head = g.heads[bucket];
  g.next[index] = head;
  g.previous[index] = -1;
  if (head !== -1) {
    g.previous[head] = index;
  }
  g.heads[bucket] = index;
}

export function moveGridPoint(
  g: GridBuffers,
  index: number,
  x: number,
  y: number,
) {
  const bucket = slotCell(g, index),
    previous = g.previous[index],
    next = g.next[index];
  if (previous === -1) {
    g.heads[bucket] = next;
  } else {
    g.next[previous] = next;
  }
  if (next !== -1) {
    g.previous[next] = previous;
  }
  g.coordinates[index * 2] = x;
  g.coordinates[index * 2 + 1] = y;
  insert(g, index);
}

/** Transferable linked-cell index; construction has no DOM or renderer dependencies. */
export function buildGrid(
  coordinates: Float64Array,
  cells = 128,
  bounds?: Pick<GridBuffers, "minX" | "minY" | "width" | "height">,
): GridBuffers {
  if (
    coordinates.length % 2 ||
    !Number.isInteger(cells) ||
    cells < 1 ||
    cells > 1024
  ) {
    throw new RangeError("Invalid grid dimensions");
  }
  if (
    bounds &&
    (!Object.values(bounds).every(Number.isFinite) ||
      bounds.width <= 0 ||
      bounds.height <= 0)
  ) {
    throw new RangeError("Invalid grid bounds");
  }
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (let i = 0; !bounds && i < coordinates.length; i += 2) {
    const x = coordinates[i],
      y = coordinates[i + 1];
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new RangeError("Grid coordinates must be finite");
    }
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  const count = coordinates.length / 2;
  const result: GridBuffers = {
    coordinates,
    cells,
    minX: bounds?.minX ?? (count ? minX : 0),
    minY: bounds?.minY ?? (count ? minY : 0),
    width: bounds?.width ?? (count ? maxX - minX || 1 : 1),
    height: bounds?.height ?? (count ? maxY - minY || 1 : 1),
    heads: new Int32Array(cells * cells).fill(-1),
    next: new Int32Array(count).fill(-1),
    previous: new Int32Array(count).fill(-1),
  };
  for (let index = 0; index < count; index++) {
    if (
      bounds &&
      (!Number.isFinite(coordinates[index * 2]) ||
        !Number.isFinite(coordinates[index * 2 + 1]))
    ) {
      throw new RangeError("Grid coordinates must be finite");
    }
    insert(result, index);
  }
  return result;
}

export class PreparedGrid<T> {
  private cache = new Map<number, IndexedPoint<T>>();
  get lazy() {
    return !Array.isArray(this.points);
  }
  get length() {
    return this.points.length;
  }
  coordinate(index: number) {
    return {
      x: this.buffers.coordinates[index * 2],
      y: this.buffers.coordinates[index * 2 + 1],
    };
  }
  at(index: number): IndexedPoint<T> {
    if (Array.isArray(this.points)) {
      return this.points[index];
    }
    let point = this.cache.get(index);
    if (!point) {
      point = this.points.get(index);
      this.cache.set(index, point);
    }
    return point;
  }
  constructor(
    private points: IndexedPoint<T>[] | PointSource<T>,
    private buffers: GridBuffers,
  ) {
    if (
      buffers.coordinates.length !== points.length * 2 ||
      buffers.next.length !== points.length ||
      buffers.previous.length !== points.length ||
      buffers.heads.length !== buffers.cells * buffers.cells
    ) {
      throw new RangeError("Prepared grid length mismatch");
    }
    for (
      let index = 0;
      Array.isArray(points) && index < points.length;
      index++
    ) {
      if (
        points[index].dataIndex !== index ||
        points[index].seriesId !== points[0].seriesId
      ) {
        throw new RangeError(
          "Prepared grids require one series with contiguous identities",
        );
      }
    }
  }
  get(seriesId: string, index: number) {
    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= this.points.length ||
      (!Array.isArray(this.points) && this.points.seriesId !== seriesId)
    ) {
      return undefined;
    }
    const point = this.at(index);
    return point?.seriesId === seriesId ? point : undefined;
  }
  query(
    x0: number,
    y0: number,
    x1: number,
    y1: number,
    visit: (point: IndexedPoint<T>) => void,
    accepts?: (x: number, y: number) => boolean,
  ) {
    const g = this.buffers;
    const left = cell(x0, g.minX, g.width, g.cells),
      right = cell(x1, g.minX, g.width, g.cells),
      top = cell(y0, g.minY, g.height, g.cells),
      bottom = cell(y1, g.minY, g.height, g.cells);
    for (let y = top; y <= bottom; y++) {
      for (let x = left; x <= right; x++) {
        for (
          let index = g.heads[y * g.cells + x];
          index !== -1;
          index = g.next[index]
        ) {
          const px = g.coordinates[index * 2],
            py = g.coordinates[index * 2 + 1];
          if (
            px >= x0 &&
            px <= x1 &&
            py >= y0 &&
            py <= y1 &&
            (!accepts || accepts(px, py))
          ) {
            visit(this.at(index));
          }
        }
      }
    }
  }
  patch(points: IndexedPoint<T>[]) {
    for (const point of points) {
      if (
        !this.get(point.seriesId, point.dataIndex) ||
        !Number.isFinite(point.x) ||
        !Number.isFinite(point.y)
      ) {
        throw new RangeError(
          "Grid patches require existing identities and finite coordinates",
        );
      }
    }
    const g = this.buffers;
    for (const point of points) {
      const index = point.dataIndex;
      moveGridPoint(g, index, point.x, point.y);
      if (Array.isArray(this.points)) {
        this.points[index] = point;
      } else {
        this.cache.set(index, point);
      }
    }
  }
}
