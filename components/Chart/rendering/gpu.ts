import { type ClipPolygon, counterclockwise } from "./clip-geometry";
import { createGpuResources } from "./gpu-resources";
import { acquireWebGpuSurface, type GpuTarget } from "./webgpu-surface";

/** A density frame is immutable; replace its identity when its buffers change. */
export interface DensityFrame {
  positions: Float32Array;
  counts: Float32Array;
  cells: number;
}

export interface GpuPointSource {
  /** Immutable sources borrow their buffer; updates require a new source identity. */
  immutable?: true;
  length: number;
  buffers(): { positions: Float32Array; radii?: Float32Array };
}
export interface GpuAxis {
  type: "linear" | "log";
  domain: readonly [number, number];
}
const axisParameters = (axis?: GpuAxis): [number, number, number] => {
  const domain = axis?.domain ?? [0, 1];
  const log = axis?.type === "log";
  const start = log ? Math.log10(domain[0]) : domain[0];
  const end = log ? Math.log10(domain[1]) : domain[1];
  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    !Number.isFinite(Math.fround(start)) ||
    !Number.isFinite(Math.fround(end)) ||
    !Number.isFinite(Math.fround(Math.fround(end) - Math.fround(start))) ||
    Math.fround(start) === Math.fround(end)
  ) {
    throw new RangeError(
      "GPU axes require finite, distinct representable bounds",
    );
  }
  return [start, end, Number(log)];
};

export interface GpuView {
  clipPolygon?: ClipPolygon;
  /** Affine circle-local radius/stroke basis in canvas CSS pixels; positions use matrix separately. */
  pointTransform?: readonly [number, number, number, number];
  /** Opacity of each complete point, including its fill and stroke. */
  opacity?: number;
  /** Internal same-context opacity layer. Defaults to the canvas. */
  target?: GpuTarget | null;
  /** Clear the shared framebuffer before drawing; defaults to true. */
  clear?: boolean;
  /** Additional clip in CSS canvas pixels; empty rectangles draw nothing. */
  clip?: { x: number; y: number; width: number; height: number };
  axes?: { x: GpuAxis; y: GpuAxis };
  density?: DensityFrame;
  width: number;
  height: number;
  plotWidth: number;
  plotHeight: number;
  k: number;
  x: number;
  y: number;
  matrix: DOMMatrix;
  ratio: number;
  radius: number;
  color: number[];
  /** Selected rows retain full opacity; all other rows use this multiplier. */
  emphasis?: {
    indices: readonly number[];
    opacity: number;
    /** Applied after indices; later overrides of the same row win. */
    overrides?: readonly { index: number; opacity: number }[];
  };
  /** Centered on the circle boundary; width is in CSS pixels. */
  stroke?: { color: number[]; width: number };
}

const gpuFinite = (value: number) => Number.isFinite(Math.fround(value));
function pointBasis(basis: GpuView["pointTransform"]) {
  if (!basis) {
    return { scale: 1, extent: 1, inverse: [1, 0, 0, 1], transformed: false };
  }
  if (!basis.every(gpuFinite)) {
    throw new RangeError("GPU point transform must be finite");
  }
  const [a, b, c, d] = basis.map(Math.fround);
  const determinant = a * d - b * c;
  if (determinant === 0) {
    return { scale: 0, extent: 0, inverse: [0, 0, 0, 0], transformed: true };
  }
  const xLength = Math.hypot(a, b),
    yLength = Math.hypot(c, d);
  // Similarities (including reflection) keep the existing circular sprite fast path.
  if (
    Math.abs(xLength - yLength) <= 1e-7 * Math.max(xLength, yLength) &&
    Math.abs(a * c + b * d) <= 1e-7 * xLength * yLength
  ) {
    return {
      scale: xLength,
      extent: 1,
      inverse: [1, 0, 0, 1],
      transformed: false,
    };
  }
  const inverse = [
    d / determinant,
    -b / determinant,
    -c / determinant,
    a / determinant,
  ];
  if (!inverse.every(gpuFinite)) {
    throw new RangeError("GPU point inverse must be representable");
  }
  return {
    scale: 1,
    extent: Math.max(Math.hypot(a, c), Math.hypot(b, d)),
    inverse,
    transformed: true,
  };
}

function validateView(view: GpuView) {
  if (
    view.opacity !== undefined &&
    (!Number.isFinite(view.opacity) || view.opacity < 0 || view.opacity > 1)
  ) {
    throw new RangeError("GPU opacity must be in [0, 1]");
  }
  const positive = [
    view.width,
    view.height,
    view.plotWidth,
    view.plotHeight,
    view.k,
    view.ratio,
  ];
  const clip = view.clip;
  if (
    clip &&
    (![
      clip.x,
      clip.y,
      clip.width,
      clip.height,
      clip.x + clip.width,
      clip.y + clip.height,
    ].every(Number.isFinite) ||
      clip.width < 0 ||
      clip.height < 0)
  ) {
    throw new RangeError(
      "GPU clip requires finite bounds and nonnegative dimensions",
    );
  }
  const m = view.matrix;
  const stroke = view.stroke;
  if (
    stroke &&
    (!gpuFinite(stroke.width) ||
      stroke.width < 0 ||
      !gpuFinite(stroke.width * view.ratio) ||
      stroke.color.length !== 4 ||
      stroke.color.some(
        (value) => !Number.isFinite(value) || value < 0 || value > 1,
      ))
  ) {
    throw new RangeError(
      "GPU stroke requires a finite nonnegative width and RGBA color",
    );
  }
  if (
    positive.some((value) => !gpuFinite(value) || Math.fround(value) <= 0) ||
    !gpuFinite(view.radius) ||
    view.radius < 0 ||
    ![
      view.x,
      view.y,
      m.a,
      m.b,
      m.c,
      m.d,
      m.e,
      m.f,
      view.radius * 2 * view.ratio,
      view.plotWidth * view.k,
      view.plotHeight * view.k,
    ].every(gpuFinite) ||
    view.color.length !== 4 ||
    view.color.some(
      (value) => !Number.isFinite(value) || value < 0 || value > 1,
    )
  ) {
    throw new RangeError(
      "GPU view requires finite dimensions, transforms, radius and RGBA color",
    );
  }
}
function validateDensity(density: DensityFrame) {
  if (
    !Number.isSafeInteger(density.cells) ||
    density.cells <= 0 ||
    density.positions.length !== density.counts.length * 2 ||
    density.counts.some((count) => !Number.isFinite(count) || count < 0)
  ) {
    throw new RangeError(
      "GPU density requires paired positions, nonnegative counts and positive cells",
    );
  }
}

export function createGpuPoints(
  canvas: HTMLCanvasElement,
  options: { onStatusChange?: () => void } = {},
) {
  const surface = acquireWebGpuSurface(canvas, { sampleCount: 1 });
  let disposed = false;
  let uploadedDensity: DensityFrame | undefined;
  let uploaded: GpuPointSource | undefined;
  let positions: Float32Array = new Float32Array(0);
  let radii: Float32Array | undefined;
  let maxRadius = 0;
  let maxWeight = 0;
  const dirty = new Set<number>();
  let emphasisSource: GpuPointSource | DensityFrame | undefined;
  let selected = new Map<number, number>();
  let latest: { data: GpuPointSource; view: GpuView } | undefined;
  let owned: ReturnType<typeof createGpuResources> | undefined;
  let resourceError: string | undefined;
  let queued = false;
  let uploadRevision = surface.abortRevision;
  function write(buffer: GPUBuffer, offset: number, data: Float32Array) {
    surface.writeBuffer(buffer, offset, data);
  }
  function allocate(
    data: Float32Array | number,
    label: string,
    usage = GPUBufferUsage.STORAGE,
  ) {
    const buffer = surface.device.createBuffer({
      label,
      size: Math.max(16, typeof data === "number" ? data : data.byteLength),
      usage: usage | GPUBufferUsage.COPY_DST,
    });
    if (typeof data !== "number" && data.byteLength) {
      try {
        // A fresh buffer cannot be referenced by earlier commands in this frame.
        surface.device.queue.writeBuffer(
          buffer,
          0,
          data.buffer as ArrayBuffer,
          data.byteOffset,
          data.byteLength,
        );
      } catch (error) {
        buffer.destroy();
        throw error;
      }
    }
    return buffer;
  }
  function replace(
    key: "buffer" | "radii" | "weights" | "emphasis",
    data: Float32Array | number,
  ) {
    const previous = owned![key];
    owned![key] = allocate(
      data,
      `Chart point ${key}`,
      key === "buffer" ? GPUBufferUsage.VERTEX : GPUBufferUsage.STORAGE,
    );
    if (previous) {
      surface.defer(() => previous.destroy());
    }
  }
  function reset() {
    owned = undefined;
    uploaded = undefined;
    uploadedDensity = undefined;
    emphasisSource = undefined;
    selected.clear();
  }
  function initialize() {
    if (!surface.available || surface.error || disposed) {
      return;
    }
    try {
      owned ??= createGpuResources(
        surface.device,
        surface.format,
        surface.sampleCount,
      );
      resourceError = undefined;
    } catch (error) {
      resourceError = error instanceof Error ? error.message : String(error);
    }
  }
  const draw = (data: GpuPointSource, view: GpuView) => {
    if (disposed) {
      return;
    }
    if (uploadRevision !== surface.abortRevision) {
      // Aborted command encoders discard staged patches. Rebuild retained
      // buffers from the source before trusting any CPU upload metadata.
      uploadRevision = surface.abortRevision;
      uploaded = undefined;
      uploadedDensity = undefined;
      emphasisSource = undefined;
      selected.clear();
    }
    validateView(view);
    const density = view.density;
    const xAxis = axisParameters(density ? undefined : view.axes?.x);
    const yAxis = axisParameters(density ? undefined : view.axes?.y);
    if (
      !Number.isSafeInteger(data.length) ||
      data.length < 0 ||
      data.length > 0x7fffffff
    ) {
      throw new RangeError("GPU sources require a valid point count");
    }
    const count = density ? density.counts.length : data.length;
    const nextSelected = new Map<number, number>(
      view.emphasis?.indices.map((index) => [index, 1]),
    );
    if (
      view.emphasis &&
      (!Number.isFinite(view.emphasis.opacity) ||
        view.emphasis.opacity < 0 ||
        view.emphasis.opacity > 1 ||
        [...nextSelected.keys()].some(
          (index) => !Number.isInteger(index) || index < 0 || index >= count,
        ))
    ) {
      throw new RangeError(
        "GPU emphasis requires existing indices and opacity in [0, 1]",
      );
    }
    for (const override of view.emphasis?.overrides ?? []) {
      if (
        !Number.isInteger(override.index) ||
        override.index < 0 ||
        override.index >= count ||
        !Number.isFinite(override.opacity) ||
        override.opacity < 0 ||
        override.opacity > 1
      ) {
        throw new RangeError(
          "GPU emphasis overrides require existing indices and opacity in [0, 1]",
        );
      }
      nextSelected.set(override.index, override.opacity);
    }
    let compact: Float32Array | undefined;
    let nextRadii = radii;
    let nextMaxRadius = uploaded === data ? maxRadius : 0;
    if (!density) {
      if (uploaded !== data || dirty.size > 0) {
        const buffers = data.buffers();
        compact = buffers.positions;
        nextRadii = buffers.radii;
        if (nextRadii) {
          if (nextRadii.length !== data.length) {
            throw new RangeError("GPU radii require one radius per point");
          }
          const validateRadius = (radius: number) => {
            if (!gpuFinite(radius) || radius < 0) {
              throw new RangeError("GPU radii must be finite and nonnegative");
            }
            nextMaxRadius = Math.max(nextMaxRadius, radius);
          };
          if (uploaded !== data || !radii) {
            for (const radius of nextRadii) {
              validateRadius(radius);
            }
          } else {
            for (const index of dirty) {
              validateRadius(nextRadii[index]);
            }
          }
        }
      }
      if ((compact ?? positions).length !== data.length * 2) {
        throw new RangeError(
          "GPU position buffer must contain two coordinates per point",
        );
      }
    }
    if (density && uploadedDensity !== density) {
      validateDensity(density);
    }
    const basis = pointBasis(view.pointTransform);
    const radiusRatio = view.ratio * basis.scale;
    const strokeWidth = (view.stroke?.width ?? 0) * radiusRatio;
    const diameter =
      (density
        ? (Math.min(view.plotWidth, view.plotHeight) * view.k) / density.cells
        : (nextRadii ? nextMaxRadius : view.radius) * 2) *
        radiusRatio +
      strokeWidth;
    if (!gpuFinite(diameter * basis.extent) || diameter < 0) {
      throw new RangeError("GPU point diameter must be finite and nonnegative");
    }

    latest = { data, view };
    if (!surface.available) {
      queued = true;
      return;
    }
    initialize();
    if (!owned) {
      queued = true;
      return;
    }
    queued = false;
    const m = view.matrix;
    const [a, b, c, d, e, f] = [m.a, m.b, m.c, m.d, m.e, m.f].map(Math.fround);
    const determinant = a * d - b * c;
    const inverse =
      determinant === 0
        ? [0, 0, 0, 0, 0, 0, 0, 0, 0]
        : [
            d / determinant,
            -b / determinant,
            0,
            -c / determinant,
            a / determinant,
            0,
            (c * f - d * e) / determinant,
            (b * e - a * f) / determinant,
            1,
          ];
    const footprint = diameter * basis.extent * 0.5 + 1;
    const padX =
      determinant === 0
        ? Infinity
        : footprint *
          Math.hypot(
            (inverse[0] * view.width) / canvas.width,
            (inverse[3] * view.height) / canvas.height,
          );
    const padY =
      determinant === 0
        ? Infinity
        : footprint *
          Math.hypot(
            (inverse[1] * view.width) / canvas.width,
            (inverse[4] * view.height) / canvas.height,
          );

    const resources = owned;
    if (density) {
      if (uploadedDensity !== density) {
        replace("buffer", density.positions);
        replace("weights", density.counts);
        maxWeight = 0;
        for (const weight of density.counts) {
          maxWeight = Math.max(maxWeight, weight);
        }
        uploadedDensity = density;
        uploaded = undefined;
      }
      radii = undefined;
    } else {
      uploadedDensity = undefined;
      if (nextRadii && (uploaded !== data || !radii)) {
        radii = data.immutable ? nextRadii : nextRadii.slice();
        replace("radii", radii);
      } else if (!nextRadii) {
        radii = undefined;
      }
      maxRadius = nextMaxRadius;
      if (uploaded !== data) {
        positions = data.immutable ? compact! : compact!.slice();
        dirty.clear();
        replace("buffer", positions);
        uploaded = data;
      }
      const overlaps = (
        value: number,
        axis: number[],
        size: number,
        offset: number,
        padding: number,
      ) => {
        if (!Number.isFinite(value) || (axis[2] && value <= 0)) {
          return false;
        }
        // Log implementations have device-dependent error; uncertain patches must upload.
        if (axis[2]) {
          return true;
        }
        const start = Math.fround(axis[0]);
        const span = Math.fround(Math.fround(axis[1]) - start);
        const scale = Math.fround(size) * Math.fround(view.k);
        const pixel = ((value - start) / span) * scale + Math.fround(offset);
        // Include cancellation error as well as the transformed device-pixel footprint.
        const error =
          32 *
          2 ** -23 *
          (((Math.abs(value) + Math.abs(start)) / Math.abs(span)) *
            Math.abs(scale) +
            Math.abs(offset));
        const margin = padding + error;
        return (
          !Number.isFinite(pixel) ||
          !Number.isFinite(margin) ||
          (pixel >= -margin && pixel <= size + margin)
        );
      };
      const visible = (x: number, y: number) =>
        overlaps(x, xAxis, view.plotWidth, view.x, padX) &&
        overlaps(y, yAxis, view.plotHeight, view.y, padY);
      const ready: number[] = [];
      for (const index of dirty) {
        const x = compact![index * 2];
        const y = compact![index * 2 + 1];
        if (
          visible(x, y) ||
          visible(positions[index * 2], positions[index * 2 + 1])
        ) {
          positions[index * 2] = x;
          positions[index * 2 + 1] = y;
          if (radii && nextRadii) {
            radii[index] = nextRadii[index];
          }
          ready.push(index);
        }
      }
      ready.sort((a, b) => a - b);
      for (let start = 0; start < ready.length; ) {
        let end = start + 1;
        while (end < ready.length && ready[end] === ready[end - 1] + 1) {
          end++;
        }
        const first = ready[start],
          last = ready[end - 1] + 1;
        write(
          resources.buffer!,
          first * 8,
          positions.subarray(first * 2, last * 2),
        );
        if (radii) {
          write(resources.radii!, first * 4, radii.subarray(first, last));
        }
        for (let i = start; i < end; i++) {
          dirty.delete(ready[i]);
        }
        start = end;
      }

      canvas.dataset.gpuDirty = String(dirty.size);
      canvas.dataset.gpuPatched = String(ready.length);
    }
    if (view.emphasis || emphasisSource) {
      if (emphasisSource !== (density ?? data)) {
        replace("emphasis", count * 4);
        emphasisSource = density ?? data;
        selected.clear();
      }
      for (const index of selected.keys()) {
        if (!nextSelected.has(index)) {
          write(resources.emphasis!, index * 4, new Float32Array([0]));
        }
      }
      for (const [index, opacity] of nextSelected) {
        if (selected.get(index) !== opacity) {
          write(
            resources.emphasis!,
            index * 4,
            new Float32Array([1 + opacity]),
          );
        }
      }
      selected = nextSelected;
    }
    // Optional storage bindings use one zero element, never a point-sized CPU allocation.
    resources.radii ??= allocate(4, "Chart default radius");
    resources.weights ??= allocate(4, "Chart default weight");
    resources.emphasis ??= allocate(4, "Chart default emphasis");
    const polygon = view.clipPolygon;
    if (
      polygon?.some(
        (p) =>
          !Number.isFinite(p.x) ||
          !Number.isFinite(p.y) ||
          Math.abs(p.x) > 1e30 ||
          Math.abs(p.y) > 1e30,
      )
    ) {
      throw new RangeError(
        "GPU clip coordinates must be finite and representable",
      );
    }
    const points = polygon ? counterclockwise(polygon) : [];
    const edges = new Float32Array(Math.max(1, points.length) * 4);
    points.forEach((p, i) => {
      const q = points[(i + 1) % points.length],
        dx = q.x - p.x,
        dy = q.y - p.y,
        length = Math.hypot(dx, dy) || 1;
      edges.set(
        [-dy / length, dx / length, (dy * p.x - dx * p.y) / length, 0],
        i * 4,
      );
    });
    const values = new Float32Array(17 * 4);
    const set = (index: number, data: readonly number[]) =>
      values.set(data, index * 4);
    set(0, [view.width, view.height, canvas.width, canvas.height]);
    set(1, [view.plotWidth, view.plotHeight, view.k]);
    set(2, xAxis);
    set(3, yAxis);
    set(4, [view.x, view.y]);
    set(5, [m.a, m.c, m.e]);
    set(6, [m.b, m.d, m.f]);
    set(7, [inverse[0], inverse[3], inverse[6]]);
    set(8, [inverse[1], inverse[4], inverse[7], inverse[8]]);
    set(9, [
      radiusRatio,
      basis.extent,
      strokeWidth,
      view.emphasis?.opacity ?? 1,
    ]);
    set(10, view.color);
    set(11, view.stroke?.color ?? view.color);
    set(12, [
      density
        ? (Math.min(view.plotWidth, view.plotHeight) * view.k) /
          density.cells /
          2
        : view.radius,
      Number(!density && !!radii),
      density ? maxWeight : 0,
      Number(!!emphasisSource),
    ]);
    set(13, basis.inverse);
    set(14, [Number(basis.transformed), view.opacity ?? 1]);
    set(15, [padX, padY]);
    set(16, [polygon ? (points.length < 3 ? -1 : points.length) : 0]);
    const uniform = allocate(
      values,
      "Chart point draw uniforms",
      GPUBufferUsage.UNIFORM,
    );
    let clip: GPUBuffer | undefined;
    try {
      clip = allocate(edges, "Chart point clip edges");
      const group = surface.device.createBindGroup({
        layout: resources.pipeline.getBindGroupLayout(0),
        entries: [
          uniform,
          resources.radii,
          resources.weights,
          resources.emphasis,
          clip,
        ].map((buffer, index) => ({
          binding: [0, 2, 3, 4, 5][index],
          resource: { buffer },
        })),
      });
      canvas.dataset.gpuDrawn = String(count);
      canvas.dataset.gpuDetail = density ? "density" : "exact";
      surface.run((encoder) => {
        const pass = encoder.beginRenderPass(
          surface.passDescriptor(view.target ?? null, {
            clear: view.clear !== false,
          }),
        );
        pass.setPipeline(resources.pipeline);
        pass.setVertexBuffer(0, resources.buffer!);
        pass.setBindGroup(0, group);
        let visible = true;
        if (view.clip) {
          const edge = (value: number, size: number, pixels: number) =>
            Math.max(
              0,
              Math.ceil(
                (Math.max(0, Math.min(size, value)) / size) * pixels - 0.5,
              ),
            );
          const left = edge(view.clip.x, view.width, canvas.width),
            right = edge(
              view.clip.x + view.clip.width,
              view.width,
              canvas.width,
            );
          const top = edge(view.clip.y, view.height, canvas.height),
            bottom = edge(
              view.clip.y + view.clip.height,
              view.height,
              canvas.height,
            );
          visible = right > left && bottom > top;
          if (visible) {
            pass.setScissorRect(left, top, right - left, bottom - top);
          }
        }
        if (visible && count) {
          pass.draw(4, count);
        }
        pass.end();
      });
    } finally {
      surface.defer(() => {
        uniform.destroy();
        clip?.destroy();
      });
    }
  };
  const unsubscribe = surface.subscribe(() => {
    reset();
    initialize();
    if (owned && latest && !latest.view.target) {
      draw(latest.data, latest.view);
    }
    options.onStatusChange?.();
  });
  const ready = surface.ready.then(() => {
    initialize();
    if (queued && owned && latest && !latest.view.target) {
      draw(latest.data, latest.view);
    }
  });
  return {
    ready,
    get available() {
      return !disposed && surface.available && !!owned;
    },
    get error() {
      return resourceError ?? surface.error;
    },
    recover() {
      if (disposed) {
        return false;
      }
      if (!surface.available) {
        return surface.recover();
      }
      initialize();
      return !!owned;
    },
    patch(indices: number[]) {
      if (disposed) {
        return;
      }
      if (
        !latest ||
        indices.some(
          (index) =>
            !Number.isInteger(index) ||
            index < 0 ||
            index >= latest!.data.length,
        )
      ) {
        throw new RangeError("GPU patches require existing slots");
      }
      if (latest.data.immutable) {
        throw new Error(
          "Immutable GPU sources require replacement, not patches",
        );
      }
      indices.forEach((index) => dirty.add(index));
    },
    draw,
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      unsubscribe();
      if (owned) {
        for (const buffer of [
          owned.buffer,
          owned.radii,
          owned.weights,
          owned.emphasis,
        ]) {
          if (buffer) {
            surface.defer(() => buffer.destroy());
          }
        }
      }
      reset();
      dirty.clear();
      positions = new Float32Array(0);
      radii = undefined;
      latest = undefined;
      surface.release();
    },
  };
}
