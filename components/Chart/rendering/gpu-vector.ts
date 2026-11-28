import { type ClipPolygon, counterclockwise } from "./clip-geometry";
import { strokeMesh } from "./vector-stroke";
import { acquireWebGpuSurface, type GpuTarget } from "./webgpu-surface";
/** Canvas CSS pixels, including chart margins; colors are straight RGBA in [0, 1]. */
export interface VectorShape {
  contours: readonly {
    points: readonly { x: number; y: number }[];
    closed: boolean;
  }[];
  fill?: {
    color: readonly number[];
    gradient?: {
      y0: number;
      y1: number;
      startOpacity: number;
      endOpacity: number;
      /** Maps canvas CSS pixels (x, y, 1) to the normalized gradient offset. */
      axis?: readonly [number, number, number];
    };
  };
  stroke?: {
    color: readonly number[];
    width: number;
    dashArray?: readonly number[];
    dashOffset?: number;
    lineCap?: "butt" | "round" | "square";
    lineJoin?: "miter" | "round" | "bevel";
    miterLimit?: number;
  };
  transform?: {
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
    f: number;
  };
  opacity?: number;
}
export interface VectorView {
  /** Internal same-context opacity layer. Defaults to the canvas. */
  target?: GpuTarget | null;
  width: number;
  height: number;
  ratio: number;
  clip?: { x: number; y: number; width: number; height: number };
  clipPolygon?: ClipPolygon;
  /** False composites on an existing frame from another renderer sharing this context. */
  clear?: boolean;
}

// Keep GPU arithmetic finite, including coordinate differences and stroke offsets.
function finite(value: number) {
  if (!Number.isFinite(value) || Math.abs(value) > 1e30) {
    throw new RangeError("GPU vector value must be finite and representable");
  }
}
function unit(value: number) {
  finite(value);
  if (value < 0 || value > 1) {
    throw new RangeError("GPU vector opacity/color must be in [0, 1]");
  }
}
function validate(
  shapes: readonly VectorShape[],
  view: VectorView,
  maxSize: number,
) {
  [view.width, view.height, view.ratio].forEach(finite);
  if (
    view.width <= 0 ||
    view.height <= 0 ||
    view.ratio <= 0 ||
    view.width * view.ratio > maxSize ||
    view.height * view.ratio > maxSize
  ) {
    throw new RangeError("GPU vector viewport is out of range");
  }
  if (view.clip) {
    Object.values(view.clip).forEach(finite);
    if (view.clip.width < 0 || view.clip.height < 0) {
      throw new RangeError("GPU vector clip size must be nonnegative");
    }
  }
  for (const point of view.clipPolygon ?? []) {
    finite(point.x);
    finite(point.y);
  }
  for (const shape of shapes) {
    unit(shape.opacity ?? 1);
    if (shape.transform) {
      Object.values(shape.transform).forEach(finite);
    }
    for (const paint of [shape.fill, shape.stroke]) {
      if (!paint) {
        continue;
      }
      if (paint.color.length !== 4) {
        throw new RangeError("GPU vector requires RGBA colors");
      }
      paint.color.forEach(unit);
    }
    if (shape.stroke) {
      finite(shape.stroke.width);
      finite(shape.stroke.dashOffset ?? 0);
      finite(shape.stroke.miterLimit ?? 4);
      if ((shape.stroke.miterLimit ?? 4) < 1) {
        throw new RangeError("Invalid miter limit");
      }
      for (const value of shape.stroke.dashArray ?? []) {
        finite(value);
        if (value < 0) {
          throw new RangeError("Negative dash length");
        }
      }
      if (shape.stroke.width < 0) {
        throw new RangeError("GPU vector stroke width must be nonnegative");
      }
    }
    const gradient = shape.fill?.gradient;
    if (gradient) {
      finite(gradient.y0);
      finite(gradient.y1);
      unit(gradient.startOpacity);
      unit(gradient.endOpacity);
      if (gradient.axis && gradient.axis.length !== 3) {
        throw new RangeError(
          "GPU vector gradient axis must have three coordinates",
        );
      }
      gradient.axis?.forEach(finite);
    }
    for (const contour of shape.contours) {
      for (const point of contour.points) {
        finite(point.x);
        finite(point.y);
      }
    }
  }
}

type Bounds = [number, number, number, number];
function bounds(shape: VectorShape, pad: number): Bounds | undefined {
  let x0 = Infinity,
    y0 = Infinity,
    x1 = -Infinity,
    y1 = -Infinity;
  for (const contour of shape.contours) {
    for (const p of contour.points) {
      x0 = Math.min(x0, p.x);
      y0 = Math.min(y0, p.y);
      x1 = Math.max(x1, p.x);
      y1 = Math.max(y1, p.y);
    }
  }
  return x0 === Infinity ? undefined : [x0 - pad, y0 - pad, x1 + pad, y1 + pad];
}
function quad([x0, y0, x1, y1]: Bounds) {
  return new Float32Array([x0, y0, x1, y0, x1, y1, x0, y0, x1, y1, x0, y1]);
}
const shader = `
struct Params { viewport: vec4f, color: vec4f, gradient: vec4f, gradientAxis: vec4f, clip: vec4f }
@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var<storage, read> edges: array<vec4f>;
struct Vertex { @builtin(position) position: vec4f, @location(0) pixelY: f32 }
@vertex fn vertex(@location(0) position: vec2f) -> Vertex {
  var out: Vertex;
  out.position = vec4f(position.x / params.viewport.x * 2 - 1, 1 - position.y / params.viewport.y * 2, 0, 1);
  out.pixelY = position.y;
  return out;
}
@fragment fn fragment(in: Vertex) -> @location(0) vec4f {
  let p = in.position.xy * params.viewport.xy / params.viewport.zw;
  if (params.clip.x < 0) { discard; }
  for (var i = 0u; i < u32(params.clip.x); i++) {
    if (dot(edges[i].xy, p) + edges[i].z < -0.00001) { discard; }
  }
  let t = clamp(dot(params.gradientAxis.xyz, vec3f(p, 1)), 0, 1);
  let alpha = params.color.a * mix(params.gradient.z, params.gradient.w, t);
  return vec4f(params.color.rgb * alpha, alpha);
}`;

function resources(
  device: GPUDevice,
  format: GPUTextureFormat,
  sampleCount: number,
) {
  const module = device.createShaderModule({
    code: shader,
    label: "Chart vector",
  });
  const layout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
        buffer: { type: "uniform" },
      },
      {
        binding: 1,
        visibility: GPUShaderStage.FRAGMENT,
        buffer: { type: "read-only-storage" },
      },
    ],
  });
  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [layout],
  });
  function pipeline(mode: "fill" | "stroke" | "paint") {
    const paint = mode === "paint";
    return device.createRenderPipeline({
      label: `Chart vector ${mode}`,
      layout: pipelineLayout,
      vertex: {
        module,
        entryPoint: "vertex",
        buffers: [
          {
            arrayStride: 8,
            attributes: [{ shaderLocation: 0, offset: 0, format: "float32x2" }],
          },
        ],
      },
      fragment: {
        module,
        entryPoint: "fragment",
        targets: [
          {
            format,
            writeMask: paint ? GPUColorWrite.ALL : 0,
            blend: paint
              ? {
                  color: { srcFactor: "one", dstFactor: "one-minus-src-alpha" },
                  alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha" },
                }
              : undefined,
          },
        ],
      },
      primitive: { topology: "triangle-list", cullMode: "none" },
      multisample: { count: sampleCount },
      depthStencil: {
        format: "depth24plus-stencil8",
        depthWriteEnabled: false,
        depthCompare: "always",
        stencilReadMask: 255,
        stencilWriteMask: 255,
        stencilFront: {
          compare: paint ? "not-equal" : "always",
          passOp: paint
            ? "zero"
            : mode === "fill"
              ? "increment-wrap"
              : "replace",
        },
        stencilBack: {
          compare: paint ? "not-equal" : "always",
          passOp: paint
            ? "zero"
            : mode === "fill"
              ? "decrement-wrap"
              : "replace",
        },
      },
    });
  }
  return {
    device,
    layout,
    fill: pipeline("fill"),
    stroke: pipeline("stroke"),
    paint: pipeline("paint"),
  };
}

/** Shares the canvas device; geometry and opacity resources remain instance-owned. */
export function createGpuVector(canvas: HTMLCanvasElement) {
  const surface = acquireWebGpuSurface(canvas);
  let current: ReturnType<typeof resources> | undefined;
  let disposed = false;
  let error: string | undefined;
  let latest: { shapes: readonly VectorShape[]; view: VectorView } | undefined;
  function setup() {
    if (!disposed && surface.available && current?.device !== surface.device) {
      current = resources(surface.device, surface.format, surface.sampleCount);
      error = undefined;
    }
  }
  function render(shapes: readonly VectorShape[], view: VectorView) {
    setup();
    const r = current!;
    const width = Math.max(1, Math.round(view.width * view.ratio));
    const height = Math.max(1, Math.round(view.height * view.ratio));
    surface.resize(width, height);
    const points = view.clipPolygon ? counterclockwise(view.clipPolygon) : [];
    const edges = new Float32Array(Math.max(1, points.length) * 4);
    points.forEach((p, i) => {
      const q = points[(i + 1) % points.length],
        dx = q.x - p.x,
        dy = q.y - p.y;
      const length = Math.hypot(dx, dy) || 1;
      edges.set(
        [-dy / length, dx / length, (dy * p.x - dx * p.y) / length, 0],
        i * 4,
      );
    });
    const allocated: GPUBuffer[] = [];
    function buffer(data: Float32Array, usage: GPUBufferUsageFlags) {
      const result = r.device.createBuffer({
        size: Math.max(4, data.byteLength),
        usage,
        mappedAtCreation: true,
      });
      allocated.push(result);
      new Float32Array(result.getMappedRange()).set(data);
      result.unmap();
      return result;
    }
    try {
      const edgeBuffer = buffer(edges, GPUBufferUsage.STORAGE);
      surface.run((encoder) => {
        const pass = encoder.beginRenderPass(
          surface.passDescriptor(view.target ?? null, {
            clear: view.clear !== false,
            stencilClear: true,
          }),
        );
        if (view.clip) {
          const sx = width / view.width,
            sy = height / view.height;
          const x0 = Math.max(0, Math.min(width, Math.round(view.clip.x * sx)));
          const x1 = Math.max(
            x0,
            Math.min(width, Math.round((view.clip.x + view.clip.width) * sx)),
          );
          const y0 = Math.max(
            0,
            Math.min(height, Math.round(view.clip.y * sy)),
          );
          const y1 = Math.max(
            y0,
            Math.min(height, Math.round((view.clip.y + view.clip.height) * sy)),
          );
          pass.setScissorRect(x0, y0, x1 - x0, y1 - y0);
        }
        function paint(
          mesh: Float32Array,
          box: Bounds,
          mode: "fill" | "stroke",
          color: readonly number[],
          opacity: number,
          gradient?: NonNullable<VectorShape["fill"]>["gradient"],
        ) {
          if (!mesh.length) {
            return;
          }
          const span = gradient ? gradient.y1 - gradient.y0 : 0;
          const gradientAxis =
            gradient?.axis ??
            (span ? [0, 1 / span, -gradient!.y0 / span] : [0, 0, 0]);
          const params = buffer(
            new Float32Array([
              view.width,
              view.height,
              width,
              height,
              color[0],
              color[1],
              color[2],
              color[3] * opacity,
              gradient?.y0 ?? 0,
              gradient?.y1 ?? 1,
              gradient?.startOpacity ?? 1,
              gradient?.endOpacity ?? 1,
              ...gradientAxis,
              0,
              view.clipPolygon ? (points.length < 3 ? -1 : points.length) : 0,
              0,
              0,
              0,
            ]),
            GPUBufferUsage.UNIFORM,
          );
          const group = r.device.createBindGroup({
            layout: r.layout,
            entries: [
              { binding: 0, resource: { buffer: params } },
              { binding: 1, resource: { buffer: edgeBuffer } },
            ],
          });
          const vertices = buffer(mesh, GPUBufferUsage.VERTEX);
          const cover = buffer(quad(box), GPUBufferUsage.VERTEX);
          // Painting also zeroes the covered nonzero stencil samples. Every
          // mask is contained by its cover, so all shapes share one pass while
          // retaining nonzero winding and unioned translucent stroke coverage.
          pass.setBindGroup(0, group);
          pass.setPipeline(r[mode]);
          pass.setStencilReference(1);
          pass.setVertexBuffer(0, vertices);
          pass.draw(mesh.length / 2);
          pass.setPipeline(r.paint);
          pass.setStencilReference(0);
          pass.setVertexBuffer(0, cover);
          pass.draw(6);
        }
        for (const shape of shapes) {
          const transform = shape.transform;
          const transformed = transform
            ? {
                ...shape,
                contours: shape.contours.map((c) => ({
                  ...c,
                  points: c.points.map((p) => ({
                    x: transform.a * p.x + transform.c * p.y + transform.e,
                    y: transform.b * p.x + transform.d * p.y + transform.f,
                  })),
                })),
              }
            : shape;
          const box = bounds(transformed, 0);
          if (!box) {
            continue;
          }
          if (shape.fill) {
            const vertices: number[] = [];
            for (const c of transformed.contours) {
              for (let i = 1; i + 1 < c.points.length; i++) {
                for (const p of [c.points[0], c.points[i], c.points[i + 1]]) {
                  vertices.push(p.x, p.y);
                }
              }
            }
            paint(
              new Float32Array(vertices),
              box,
              "fill",
              shape.fill.color,
              shape.opacity ?? 1,
              shape.fill.gradient,
            );
          }
          if (shape.stroke && shape.stroke.width > 0) {
            const scale = transform
              ? Math.hypot(transform.a, transform.b, transform.c, transform.d)
              : 1;
            const mesh = strokeMesh(shape, view.ratio * scale);
            const strokeBounds: Bounds = [
              Infinity,
              Infinity,
              -Infinity,
              -Infinity,
            ];
            for (let i = 0; i < mesh.length; i += 2) {
              strokeBounds[0] = Math.min(strokeBounds[0], mesh[i]);
              strokeBounds[1] = Math.min(strokeBounds[1], mesh[i + 1]);
              strokeBounds[2] = Math.max(strokeBounds[2], mesh[i]);
              strokeBounds[3] = Math.max(strokeBounds[3], mesh[i + 1]);
            }
            paint(
              mesh,
              strokeBounds,
              "stroke",
              shape.stroke.color,
              shape.opacity ?? 1,
            );
          }
        }
        pass.end();
      });
    } finally {
      surface.defer(() => allocated.forEach((b) => b.destroy()));
    }
  }
  function restore() {
    if (disposed) {
      return;
    }
    if (!surface.available) {
      current = undefined;
      return;
    }
    try {
      setup();
      if (latest && !latest.view.target) {
        render(latest.shapes, latest.view);
      }
    } catch (cause) {
      current = undefined;
      error = cause instanceof Error ? cause.message : String(cause);
    }
  }
  const unsubscribe = surface.subscribe(restore);
  const ready = surface.ready.then(() => {
    setup();
  });
  void ready.catch(() => {});
  return {
    get ready() {
      return surface.ready.then(() => {
        setup();
      });
    },
    get available() {
      return !disposed && surface.available && !!current;
    },
    get error() {
      return error ?? surface.error;
    },
    draw(shapes: readonly VectorShape[], view: VectorView) {
      if (disposed) {
        return;
      }
      validate(
        shapes,
        view,
        surface.available ? surface.device.limits.maxTextureDimension2D : 8192,
      );
      latest = {
        shapes,
        view: { ...view, clip: view.clip && { ...view.clip } },
      };
      if (surface.available) {
        render(shapes, view);
      }
    },
    recover() {
      if (disposed) {
        return false;
      }
      if (!surface.available) {
        return surface.recover();
      }
      restore();
      return !!current;
    },
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      unsubscribe();
      current = undefined;
      latest = undefined;
      surface.release();
    },
  };
}
