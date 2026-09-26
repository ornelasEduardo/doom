export interface DensityView {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Count bins preserve multiplicity; markers represent cells, never sampled records. */
export function createDensity(coordinates: Float64Array, resolution = 512) {
  if (
    coordinates.length % 2 ||
    !Number.isInteger(resolution) ||
    resolution < 1 ||
    resolution > 1024 ||
    resolution & (resolution - 1)
  ) {
    throw new RangeError("Invalid density dimensions");
  }
  const levels: Uint32Array[] = [];
  for (let size = 1; size <= resolution; size *= 2) {
    levels.push(new Uint32Array(size * size));
  }
  const slots = new Uint32Array(coordinates.length / 2);
  const slot = (x: number, y: number) => {
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      throw new RangeError(
        "Density expects normalized coordinates within the domain",
      );
    }
    if (x < 0 || y < 0 || x > 1 || y > 1) {
      return 0xffffffff;
    }
    return (
      Math.min(resolution - 1, Math.floor(x * resolution)) +
      Math.min(resolution - 1, Math.floor(y * resolution)) * resolution
    );
  };
  const base = levels[levels.length - 1];
  for (let i = 0; i < slots.length; i++) {
    const bucket = (slots[i] = slot(
      coordinates[i * 2],
      coordinates[i * 2 + 1],
    ));
    if (bucket !== 0xffffffff) {
      base[bucket]++;
    }
  }
  for (let level = levels.length - 2; level >= 0; level--) {
    const size = 2 ** level,
      childSize = size * 2,
      child = levels[level + 1];
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const i = y * 2 * childSize + x * 2;
        levels[level][y * size + x] =
          child[i] +
          child[i + 1] +
          child[i + childSize] +
          child[i + childSize + 1];
      }
    }
  }
  const views = new Map<
    string,
    { positions: Float32Array; counts: Float32Array; cells: number }
  >();
  let revision = 0;
  return {
    get revision() {
      return revision;
    },
    patch(index: number, x: number, y: number) {
      if (!Number.isInteger(index) || index < 0 || index >= slots.length) {
        throw new RangeError("Unknown density identity");
      }
      const next = slot(x, y),
        old = slots[index];
      if (old === next) {
        return;
      }
      let ox = old % resolution,
        oy = Math.floor(old / resolution),
        nx = next % resolution,
        ny = Math.floor(next / resolution);
      for (let level = levels.length - 1; level >= 0; level--) {
        const size = 2 ** level;
        if (old !== 0xffffffff) {
          levels[level][oy * size + ox]--;
        }
        if (next !== 0xffffffff) {
          levels[level][ny * size + nx]++;
        }
        ox >>= 1;
        oy >>= 1;
        nx >>= 1;
        ny >>= 1;
      }
      slots[index] = next;
      revision++;
      views.clear();
    },
    view(viewport: DensityView, targetCells: number) {
      if (
        ![
          viewport.x,
          viewport.y,
          viewport.width,
          viewport.height,
          targetCells,
        ].every(Number.isFinite) ||
        !(viewport.width > 0 && viewport.height > 0 && targetCells > 0)
      ) {
        throw new RangeError("Invalid density viewport");
      }
      const level = Math.max(
        0,
        Math.min(
          levels.length - 1,
          Math.ceil(Math.log2(targetCells / viewport.width)),
        ),
      );
      const cells = 2 ** level,
        counts = levels[level];
      const left = Math.max(0, Math.floor(viewport.x * cells)),
        right = Math.min(
          cells,
          Math.ceil((viewport.x + viewport.width) * cells),
        );
      const top = Math.max(0, Math.floor(viewport.y * cells)),
        bottom = Math.min(
          cells,
          Math.ceil((viewport.y + viewport.height) * cells),
        );
      const key = [level, left, right, top, bottom].join(":");
      const cached = views.get(key);
      if (cached) {
        return cached;
      }
      const capacity = Math.max(0, right - left) * Math.max(0, bottom - top);
      const positions = new Float32Array(capacity * 2),
        weights = new Float32Array(capacity);
      let length = 0;
      for (let y = top; y < bottom; y++) {
        for (let x = left; x < right; x++) {
          const count = counts[y * cells + x];
          if (count) {
            positions[length * 2] = (x + 0.5) / cells;
            positions[length * 2 + 1] = (y + 0.5) / cells;
            weights[length++] = count;
          }
        }
      }
      const frame = {
        positions: positions.subarray(0, length * 2),
        counts: weights.subarray(0, length),
        cells,
      };
      if (views.size === 4) {
        views.delete(views.keys().next().value!);
      }
      views.set(key, frame);
      return frame;
    },
  };
}
