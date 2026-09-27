import {
  buildGrid,
  type GridBuffers,
} from "../../components/Chart/engine/PreparedGrid";
import {
  type CoordinateEncoding,
  validateCompactRequest,
} from "./compact-protocol";
import { serviceLabel } from "./data";
import { createDensity } from "./density";
import {
  packServiceGeometry,
  packServiceValues,
  projectServiceValues,
} from "./direct-data";
import type { GpuAxis } from "./gpu";
import { createNumericGeometry, type NumericChange } from "./numeric-geometry";
import type { Service } from "./scatter";

export interface PreparationTimings {
  preparationMs?: number;
  indexMs?: number;
}
export interface CompactBuffers {
  encoding?: CoordinateEncoding;
  timings?: PreparationTimings;
  values: Float64Array;
  positions: Float32Array;
  grid: GridBuffers;
}
export function prepareCompact(
  count: number,
  revision = 0,
  encoding: CoordinateEncoding = "projected",
): CompactBuffers {
  validateCompactRequest(count, revision, encoding);
  const start = performance.now();
  const projectedData =
    encoding === "projected" ? packServiceGeometry(count, revision) : undefined;
  const { values, positions } =
    projectedData ?? packServiceValues(count, revision);
  const coordinates =
    projectedData?.coordinates ?? projectServiceValues(values);
  const projected = performance.now();
  const grid = buildGrid(coordinates, 128, {
    minX: 0,
    minY: 0,
    width: 1,
    height: 1,
  });
  return {
    encoding,
    values,
    positions,
    grid,
    timings: {
      preparationMs: projected - start,
      indexMs: performance.now() - projected,
    },
  };
}
export function adoptCompact(buffers: CompactBuffers) {
  return adoptDrawing(buffers);
}
export function adoptDrawing(input: {
  values: Float64Array | Float32Array;
  positions: Float32Array;
  grid?: GridBuffers;
  timings?: PreparationTimings;
  encoding?: CoordinateEncoding;
}) {
  let values = input.values,
    grid = input.grid;
  const { positions, encoding = "projected" } = input;
  const timings = { ...input.timings };
  if (values.length % 2 || positions.length !== values.length) {
    throw new RangeError("Invalid drawing dimensions");
  }
  validateDrawingValues(values, positions);
  const buffers = {
    get values() {
      return values;
    },
    positions,
    get grid() {
      if (!grid) {
        throw new Error("Interaction index is not ready");
      }
      return grid;
    },
  };
  const length = values.length / 2;
  const get = (index: number): Service => ({
    label: serviceLabel(index),
    requests: values[index * 2],
    latency: values[index * 2 + 1],
  });
  let summary = length ? [get(0)] : [];
  const point = (index: number) => ({
    dataIndex: index,
    seriesId: "",
    data: get(index),
    x: grid
      ? grid.coordinates[index * 2]
      : encoding === "raw"
        ? Math.log10(values[index * 2]) / 3
        : positions[index * 2],
    y: grid
      ? grid.coordinates[index * 2 + 1]
      : encoding === "raw"
        ? 1 - Math.log10(values[index * 2 + 1]) / 3
        : positions[index * 2 + 1],
  });
  const makeGeometry = (index: GridBuffers, source = values) =>
    createNumericGeometry(
      {
        length,
        x: { values: source, stride: 2 },
        y: { values: source, stride: 2, offset: 1 },
        projectX: (x) => Math.log10(x) / 3,
        projectY: (y) => 1 - Math.log10(y) / 3,
      },
      { coordinates: index.coordinates, positions, grid: index, encoding },
    );
  let geometry = grid ? makeGeometry(grid) : undefined;
  const listeners = new Set<(indices: number[]) => void>();
  let revision = 0;
  const originals = new Map<number, number>();
  let density: ReturnType<typeof createDensity> | undefined;
  const patch = (changes: readonly NumericChange[]) => {
    if (!geometry) {
      throw new Error("Interaction index is not ready");
    }
    const changed = geometry.patch(changes);
    if (density) {
      for (const i of changed) {
        density.patch(
          i,
          buffers.grid.coordinates[i * 2],
          buffers.grid.coordinates[i * 2 + 1],
        );
      }
    }
    if (changed.includes(0)) {
      summary = [get(0)];
    }
    if (changed.length) {
      listeners.forEach((listener) => listener(changed));
    }
    return changed;
  };
  return {
    gpuAxes: (): { x: GpuAxis; y: GpuAxis } | undefined =>
      encoding === "raw"
        ? {
            x: { type: "log", domain: [1, 1000] },
            y: { type: "log", domain: [1000, 1] },
          }
        : undefined,
    timings: () => timings,
    density: () => (density ??= createDensity(buffers.grid.coordinates)),
    patch,
    get ready() {
      return !!grid;
    },
    attachGrid({
      grid: index,
      indexMs,
      values: exactValues,
    }: {
      grid: GridBuffers;
      indexMs?: number;
      values?: Float64Array;
    }) {
      if (grid) {
        throw new Error("Interaction index already attached");
      }
      if (index.coordinates.length !== length * 2) {
        throw new RangeError("Grid length mismatch");
      }
      if (exactValues && exactValues.length !== length * 2) {
        throw new RangeError("Value length mismatch");
      }
      const nextValues = exactValues ?? values;
      const nextGeometry = makeGeometry(index, nextValues);
      values = nextValues;
      summary = length ? [get(0)] : [];
      timings.indexMs = indexMs;
      geometry = nextGeometry;
      grid = index;
      listeners.forEach((listener) => listener([]));
    },
    length,
    buffers: () => buffers,
    get,
    point,
    get summary() {
      return summary;
    },
    subscribe(listener: (indices: number[]) => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    editSample(count: number) {
      revision++;
      const changed: number[] = [];
      const updates: NumericChange[] = [];
      for (let i = 0; i < length && changed.length < count; i++) {
        const baseline = originals.get(i) ?? values[i * 2 + 1];
        originals.set(i, baseline);
        const value =
          revision % 2
            ? Math.min(1000, Math.round(baseline * 115) / 100)
            : baseline;
        if (value === values[i * 2 + 1]) {
          continue;
        }
        updates.push({ index: i, x: values[i * 2], y: value });
        changed.push(i);
      }
      return patch(updates).length;
    },
  };
}
export type CompactWorld = ReturnType<typeof adoptCompact>;

function validateDrawingValues(
  values: Float64Array | Float32Array,
  positions: Float32Array,
) {
  if (values === positions) {
    // Raw drawing borrows one Float32 buffer for both views.
    for (let i = 0; i < positions.length; i++) {
      const value = positions[i];
      if (!(value > 0 && value < Infinity)) {
        throw new RangeError("Invalid drawing values");
      }
    }
  } else {
    for (let i = 0; i < values.length; i++) {
      const value = values[i];
      if (!(value > 0 && value < Infinity) || !Number.isFinite(positions[i])) {
        throw new RangeError("Invalid drawing values");
      }
    }
  }
}
