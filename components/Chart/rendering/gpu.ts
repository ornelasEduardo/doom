import { createGpuResources } from "./gpu-resources";

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
function validateView(view: GpuView) {
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
  const gl = canvas.getContext("webgl2", {
    antialias: false,
    depth: false,
    stencil: false,
  });
  if (!gl) {
    throw new Error("WebGL2 is required for GPU point rendering.");
  }
  const context = gl;
  let disposed = false;
  let uploadedDensity: DensityFrame | undefined;
  let uploaded: GpuPointSource | undefined;
  let positions: Float32Array = new Float32Array(0);
  let radii: Float32Array | undefined;
  let maxRadius = 0;
  const dirty = new Set<number>();
  let emphasisSource: GpuPointSource | DensityFrame | undefined;
  let selected = new Map<number, number>();
  const inactiveFlag = new Float32Array([0]);
  let latest: { data: GpuPointSource; view: GpuView } | undefined;
  let owned: ReturnType<typeof createGpuResources> | undefined =
    createGpuResources(context);
  let restorationError: string | undefined;
  function restoreResources() {
    try {
      owned ??= createGpuResources(context);
    } catch (error) {
      restorationError = error instanceof Error ? error.message : String(error);
      canvas.dataset.gpuError = restorationError;
      throw error;
    }
    restorationError = undefined;
    delete canvas.dataset.gpuError;
  }
  let maxWeight = 0;
  const draw = (data: GpuPointSource, view: GpuView) => {
    if (disposed) {
      return;
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
    const strokeWidth = (view.stroke?.width ?? 0) * view.ratio;
    const diameter =
      (density
        ? (Math.min(view.plotWidth, view.plotHeight) * view.k) / density.cells
        : (nextRadii ? nextMaxRadius : view.radius) * 2) *
        view.ratio +
      strokeWidth;
    if (!gpuFinite(diameter) || diameter < 0) {
      throw new RangeError("GPU point diameter must be finite and nonnegative");
    }
    latest = { data, view };
    if (context.isContextLost()) {
      return;
    }
    const recovering = !owned;
    if (recovering) {
      try {
        restoreResources();
      } catch (error) {
        options.onStatusChange?.();
        throw error;
      }
    }
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
    const footprint = diameter * 0.5 + 1;
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
    const resources = owned!;
    const { program, buffer, vao, uniforms: u } = resources;
    context.useProgram(program);
    context.bindVertexArray(vao);
    context.bindBuffer(context.ARRAY_BUFFER, buffer);
    if (!density && nextRadii) {
      resources.radii ??= context.createBuffer();
      if (!resources.radii) {
        throw new Error("GPU radius buffer allocation failed");
      }
      context.bindBuffer(context.ARRAY_BUFFER, resources.radii);
      context.vertexAttribPointer(
        resources.radiusAttribute,
        1,
        context.FLOAT,
        false,
        0,
        0,
      );
      context.enableVertexAttribArray(resources.radiusAttribute);
      if (uploaded !== data || !radii) {
        radii = data.immutable ? nextRadii : nextRadii.slice();
        context.bufferData(context.ARRAY_BUFFER, radii, context.STATIC_DRAW);
      }
      context.bindBuffer(context.ARRAY_BUFFER, buffer);
      maxRadius = nextMaxRadius;
    } else {
      radii = undefined;
      maxRadius = 0;
      context.disableVertexAttribArray(resources.radiusAttribute);
      context.vertexAttrib1f(
        resources.radiusAttribute,
        density
          ? (Math.min(view.plotWidth, view.plotHeight) * view.k) /
              density.cells /
              2
          : view.radius,
      );
    }
    if (density) {
      if (uploadedDensity !== density) {
        context.bufferData(
          context.ARRAY_BUFFER,
          density.positions,
          context.STATIC_DRAW,
        );
        context.bindBuffer(context.ARRAY_BUFFER, resources.weights);
        context.bufferData(
          context.ARRAY_BUFFER,
          density.counts,
          context.STATIC_DRAW,
        );
        context.vertexAttribPointer(
          resources.weightAttribute,
          1,
          context.FLOAT,
          false,
          0,
          0,
        );
        maxWeight = 0;
        for (const count of density.counts) {
          maxWeight = Math.max(maxWeight, count);
        }
        uploadedDensity = density;
        uploaded = undefined;
      }
      context.enableVertexAttribArray(resources.weightAttribute);
    } else {
      uploadedDensity = undefined;
      context.disableVertexAttribArray(resources.weightAttribute);
      context.vertexAttrib1f(resources.weightAttribute, 1);
      if (uploaded !== data) {
        positions = data.immutable ? compact! : compact!.slice();
        dirty.clear();
        context.bufferData(
          context.ARRAY_BUFFER,
          positions,
          context.STATIC_DRAW,
        );
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
        context.bufferSubData(
          context.ARRAY_BUFFER,
          first * 8,
          positions.subarray(first * 2, last * 2),
        );
        if (radii) {
          context.bindBuffer(context.ARRAY_BUFFER, resources.radii);
          context.bufferSubData(
            context.ARRAY_BUFFER,
            first * 4,
            radii.subarray(first, last),
          );
          context.bindBuffer(context.ARRAY_BUFFER, buffer);
        }
        for (let i = start; i < end; i++) {
          dirty.delete(ready[i]);
        }
        start = end;
      }
      canvas.dataset.gpuDirty = String(dirty.size);
      canvas.dataset.gpuPatched = String(ready.length);
    }
    if (view.emphasis || resources.emphasis) {
      resources.emphasis ??= context.createBuffer();
      if (!resources.emphasis) {
        throw new Error("GPU emphasis buffer allocation failed");
      }
      context.bindBuffer(context.ARRAY_BUFFER, resources.emphasis);
      if (emphasisSource !== (density ?? data)) {
        // WebGL zero-initializes this GPU allocation without a row-sized CPU array.
        context.bufferData(
          context.ARRAY_BUFFER,
          count * 4,
          context.DYNAMIC_DRAW,
        );
        emphasisSource = density ?? data;
        selected.clear();
      }
      for (const index of selected.keys()) {
        if (!nextSelected.has(index)) {
          context.bufferSubData(context.ARRAY_BUFFER, index * 4, inactiveFlag);
        }
      }
      for (const [index, opacity] of nextSelected) {
        if (selected.get(index) !== opacity) {
          context.bufferSubData(
            context.ARRAY_BUFFER,
            index * 4,
            new Float32Array([1 + opacity]),
          );
        }
      }
      selected = nextSelected;
      context.vertexAttribPointer(
        resources.selectedAttribute,
        1,
        context.FLOAT,
        false,
        0,
        0,
      );
      context.enableVertexAttribArray(resources.selectedAttribute);
      context.bindBuffer(context.ARRAY_BUFFER, buffer);
    } else {
      context.disableVertexAttribArray(resources.selectedAttribute);
      context.vertexAttrib1f(resources.selectedAttribute, 0);
    }
    canvas.dataset.gpuDrawn = String(
      density ? density.counts.length : data.length,
    );
    canvas.dataset.gpuDetail = density ? "density" : "exact";
    context.bindFramebuffer(context.FRAMEBUFFER, null);
    context.disable(context.SAMPLE_ALPHA_TO_COVERAGE);
    context.disable(context.SAMPLE_COVERAGE);
    context.disable(context.STENCIL_TEST);
    context.disable(context.DEPTH_TEST);
    context.disable(context.SCISSOR_TEST);
    context.disable(context.RASTERIZER_DISCARD);
    context.colorMask(true, true, true, true);
    context.enable(context.BLEND);
    context.blendEquation(context.FUNC_ADD);
    context.blendFunc(context.ONE, context.ONE_MINUS_SRC_ALPHA);
    context.viewport(0, 0, canvas.width, canvas.height);
    if (view.clear !== false) {
      context.clearColor(0, 0, 0, 0);
      context.clear(context.COLOR_BUFFER_BIT);
    }
    if (view.clip) {
      const clip = view.clip;
      // Intersect in CSS space before conversion; retain pixels whose centers lie inside.
      const edge = (value: number, size: number, pixels: number) =>
        Math.ceil((Math.max(0, Math.min(size, value)) / size) * pixels - 0.5);
      const left = edge(clip.x, view.width, canvas.width);
      const right = edge(clip.x + clip.width, view.width, canvas.width);
      const top = edge(clip.y, view.height, canvas.height);
      const bottom = edge(clip.y + clip.height, view.height, canvas.height);
      context.enable(context.SCISSOR_TEST);
      context.scissor(left, canvas.height - bottom, right - left, bottom - top);
    }
    context.uniform3fv(u.xAxis, xAxis);
    context.uniform3fv(u.yAxis, yAxis);
    context.uniform2f(u.viewport, view.width, view.height);
    context.uniform2f(u.plot, view.plotWidth, view.plotHeight);
    context.uniform3f(u.zoom, view.x, view.y, view.k);
    context.uniform2f(u.framebuffer, canvas.width, canvas.height);
    context.uniformMatrix3fv(u.clipMatrix, false, inverse);
    context.uniform2f(u.clipPadding, padX, padY);
    context.uniformMatrix3fv(u.matrix, false, [
      m.a,
      m.b,
      0,
      m.c,
      m.d,
      0,
      m.e,
      m.f,
      1,
    ]);
    context.uniform1f(u.radiusRatio, view.ratio);
    context.uniform1f(u.inactiveOpacity, view.emphasis?.opacity ?? 1);
    context.uniform1f(u.maxWeight, density ? maxWeight : 0);
    context.uniform4fv(u.color, view.color);
    context.uniform1f(u.strokeWidth, strokeWidth);
    context.uniform4fv(u.strokeColor, view.stroke?.color ?? view.color);
    context.drawArrays(
      context.POINTS,
      0,
      density ? density.counts.length : data.length,
    );
    if (recovering) {
      options.onStatusChange?.();
    }
  };
  const lost = (event: Event) => {
    event.preventDefault();
    // Lost-context handles are invalid and cannot be reused or deleted later.
    owned = undefined;
    emphasisSource = undefined;
    selected.clear();
    uploaded = undefined;
    uploadedDensity = undefined;
    options.onStatusChange?.();
  };
  const restored = () => {
    if (disposed) {
      return;
    }
    let recovered = false;
    try {
      restoreResources();
      recovered = true;
    } catch {
      // Setup failures are retained for the getter and the next draw can retry.
    }
    // Replay and subscriber errors are caller errors, not resource failures.
    // Resources already exist, so replay does not emit another notification.
    if (recovered && latest) {
      draw(latest.data, latest.view);
    }
    options.onStatusChange?.();
  };
  canvas.addEventListener("webglcontextlost", lost);
  canvas.addEventListener("webglcontextrestored", restored);
  return {
    get available() {
      return !disposed && owned !== undefined && !context.isContextLost();
    },
    get error() {
      return restorationError;
    },
    // A scheduled caller can retry before its availability guard. This is
    // deliberately silent so persistent setup failure cannot schedule a loop.
    recover(): boolean {
      if (disposed || context.isContextLost()) {
        return false;
      }
      if (owned) {
        return true;
      }
      try {
        restoreResources();
        return true;
      } catch {
        return false;
      }
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
      canvas.removeEventListener("webglcontextlost", lost);
      canvas.removeEventListener("webglcontextrestored", restored);
      if (owned) {
        context.deleteBuffer(owned.buffer);
        context.deleteBuffer(owned.weights);
        if (owned.radii) {
          context.deleteBuffer(owned.radii);
        }
        if (owned.emphasis) {
          context.deleteBuffer(owned.emphasis);
        }
        context.deleteVertexArray(owned.vao);
        context.deleteProgram(owned.program);
        owned = undefined;
      }

      dirty.clear();
      selected.clear();
      emphasisSource = undefined;
      positions = new Float32Array(0);
      radii = undefined;
      latest = undefined;
      uploaded = undefined;
      uploadedDensity = undefined;
    },
  };
}
