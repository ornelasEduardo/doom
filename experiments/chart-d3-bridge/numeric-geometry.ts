import {
  type GridBuffers,
  moveGridPoint,
} from "../../components/Chart/engine/PreparedGrid";

export interface NumericColumn {
  values: Float32Array | Float64Array;
  offset?: number;
  stride?: number;
}
export interface NumericChange {
  index: number;
  x: number;
  y: number;
}

/** Columns are borrowed exclusively; callers publish mutations through patch. */
export function createNumericGeometry(
  input: {
    length: number;
    x: NumericColumn;
    y: NumericColumn;
    projectX: (value: number) => number;
    projectY: (value: number) => number;
  },
  prepared?: {
    coordinates: Float64Array;
    positions: Float32Array;
    grid?: GridBuffers;
    encoding?: "raw" | "projected";
  },
) {
  const { length, projectX, projectY } = input;
  if (!Number.isInteger(length) || length < 0) {
    throw new RangeError("Invalid point count");
  }
  const column = (source: NumericColumn) => {
    const offset = source.offset ?? 0,
      stride = source.stride ?? 1;
    if (
      !Number.isInteger(offset) ||
      offset < 0 ||
      !Number.isInteger(stride) ||
      stride < 1 ||
      (length && offset + (length - 1) * stride >= source.values.length)
    ) {
      throw new RangeError("Invalid numeric column");
    }
    return { ...source, offset, stride };
  };
  const x = column(input.x),
    y = column(input.y);
  if (length && x.values.buffer === y.values.buffer) {
    const xb = x.values.BYTES_PER_ELEMENT,
      yb = y.values.BYTES_PER_ELEMENT;
    const xs = x.values.byteOffset + x.offset * xb,
      ys = y.values.byteOffset + y.offset * yb;
    const xStep = x.stride * xb,
      yStep = y.stride * yb;
    const intersects =
      xs < ys + (length - 1) * yStep + yb &&
      ys < xs + (length - 1) * xStep + xb;
    if (
      intersects &&
      (xb !== yb || xStep !== yStep || (xs - ys) % xStep === 0)
    ) {
      throw new RangeError(
        "Columns must use disjoint storage or distinct fields in one interleaved layout",
      );
    }
  }
  const coordinates = prepared?.coordinates ?? new Float64Array(length * 2);
  const positions = prepared?.positions ?? new Float32Array(length * 2);
  if (coordinates.length !== length * 2 || positions.length !== length * 2) {
    throw new RangeError("Invalid projection length");
  }
  const overlaps = (a: ArrayBufferView, b: ArrayBufferView) =>
    a.buffer === b.buffer &&
    a.byteOffset < b.byteOffset + b.byteLength &&
    b.byteOffset < a.byteOffset + a.byteLength;
  if (
    [x.values, y.values].some(
      (column) => overlaps(column, coordinates) || overlaps(column, positions),
    ) ||
    overlaps(coordinates, positions)
  ) {
    throw new RangeError("Projection storage must be independent of columns");
  }
  const grid = prepared?.grid;
  if (
    grid &&
    (grid.coordinates !== coordinates ||
      !Number.isInteger(grid.cells) ||
      grid.cells < 1 ||
      grid.cells > 1024 ||
      grid.heads.length !== grid.cells * grid.cells ||
      grid.next.length !== length ||
      grid.previous.length !== length ||
      ![grid.minX, grid.minY, grid.width, grid.height].every(Number.isFinite) ||
      grid.width <= 0 ||
      grid.height <= 0)
  ) {
    throw new RangeError("Invalid prepared grid");
  }
  const validate = (vx: number, vy: number, px: number, py: number) => {
    if (
      !Number.isFinite(vx) ||
      !Number.isFinite(vy) ||
      !Number.isFinite(px) ||
      !Number.isFinite(py) ||
      !Number.isFinite(Math.fround(px)) ||
      !Number.isFinite(Math.fround(py)) ||
      (prepared?.encoding === "raw" &&
        (!Number.isFinite(Math.fround(vx)) ||
          !Number.isFinite(Math.fround(vy))))
    ) {
      throw new RangeError("Non-finite geometry");
    }
  };
  const project = (vx: number, vy: number) => {
    const px = projectX(vx),
      py = projectY(vy);
    validate(vx, vy, px, py);
    return [px, py];
  };
  if (
    prepared &&
    x.values === y.values &&
    x.offset === 0 &&
    y.offset === 1 &&
    x.stride === 2 &&
    y.stride === 2
  ) {
    validateInterleavedGeometry(
      x.values,
      coordinates,
      positions,
      length * 2,
      prepared.encoding === "raw",
    );
  } else if (prepared) {
    for (let i = 0; i < length; i++) {
      validate(
        x.values[x.offset + i * x.stride],
        y.values[y.offset + i * y.stride],
        coordinates[i * 2],
        coordinates[i * 2 + 1],
      );
      if (
        !Number.isFinite(positions[i * 2]) ||
        !Number.isFinite(positions[i * 2 + 1])
      ) {
        throw new RangeError("Non-finite GPU geometry");
      }
    }
  } else {
    for (let i = 0; i < length; i++) {
      const vx = x.values[x.offset + i * x.stride],
        vy = y.values[y.offset + i * y.stride];
      const px = projectX(vx),
        py = projectY(vy);
      validate(vx, vy, px, py);
      positions[i * 2] = coordinates[i * 2] = px;
      positions[i * 2 + 1] = coordinates[i * 2 + 1] = py;
    }
  }
  return {
    coordinates,
    positions,
    patch(changes: readonly NumericChange[]) {
      const pending = new Map<number, NumericChange>();
      for (const change of changes) {
        if (
          !Number.isInteger(change.index) ||
          change.index < 0 ||
          change.index >= length
        ) {
          throw new RangeError("Unknown point identity");
        }
        pending.set(change.index, change);
      }
      const updates = Array.from(pending.values(), (change) => {
        // Respect the storage precision before deriving CPU and GPU coordinates.
        const vx =
          x.values instanceof Float32Array ? Math.fround(change.x) : change.x;
        const vy =
          y.values instanceof Float32Array ? Math.fround(change.y) : change.y;
        return { ...change, x: vx, y: vy, projected: project(vx, vy) };
      });
      const changed: number[] = [];
      for (const update of updates) {
        const i = update.index,
          xi = x.offset + i * x.stride,
          yi = y.offset + i * y.stride;
        if (x.values[xi] === update.x && y.values[yi] === update.y) {
          continue;
        }
        x.values[xi] = update.x;
        y.values[yi] = update.y;
        if (prepared?.grid) {
          moveGridPoint(
            prepared.grid,
            i,
            update.projected[0],
            update.projected[1],
          );
        }
        coordinates[i * 2] = update.projected[0];
        coordinates[i * 2 + 1] = update.projected[1];
        positions[i * 2] =
          prepared?.encoding === "raw" ? update.x : update.projected[0];
        positions[i * 2 + 1] =
          prepared?.encoding === "raw" ? update.y : update.projected[1];
        changed.push(i);
      }
      return changed;
    },
  };
}

/** Validate contiguous fields once; fround also rejects non-finite source numbers. */
function validateInterleavedGeometry(
  values: Float32Array | Float64Array,
  coordinates: Float64Array,
  positions: Float32Array,
  size: number,
  raw: boolean,
) {
  if (raw) {
    for (let i = 0; i < size; i++) {
      if (
        !Number.isFinite(Math.fround(values[i])) ||
        !Number.isFinite(Math.fround(coordinates[i])) ||
        !Number.isFinite(positions[i])
      ) {
        throw new RangeError("Non-finite geometry");
      }
    }
  } else {
    for (let i = 0; i < size; i++) {
      if (
        !Number.isFinite(values[i]) ||
        !Number.isFinite(Math.fround(coordinates[i])) ||
        !Number.isFinite(positions[i])
      ) {
        throw new RangeError("Non-finite geometry");
      }
    }
  }
}
