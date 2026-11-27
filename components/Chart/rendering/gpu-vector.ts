import { type ClipPolygon, createGpuClip, gpuClipFragment } from "./gpu-clip";
import { strokeMesh } from "./vector-stroke";
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
  target?: WebGLFramebuffer | null;
  width: number;
  height: number;
  ratio: number;
  clip?: { x: number; y: number; width: number; height: number };
  clipPolygon?: ClipPolygon;
  /** False composites on an existing frame from another renderer sharing this context. */
  clear?: boolean;
}

const vertex = `#version 300 es
in vec2 position;
uniform vec2 viewport;
out highp float pixelY;
void main() {
  pixelY = position.y;
  gl_Position = vec4(position.x / viewport.x * 2.0 - 1.0, 1.0 - position.y / viewport.y * 2.0, 0.0, 1.0);
}`;
const fragment = `#version 300 es
precision highp float;
uniform vec4 color;
uniform vec4 gradient;
in highp float pixelY;
out vec4 outputColor;
${gpuClipFragment}
void main() {
  if (outsideGpuClip()) discard;
  float t = gradient.x == gradient.y ? 0.0 : clamp((pixelY - gradient.x) / (gradient.y - gradient.x), 0.0, 1.0);
  float alpha = color.a * mix(gradient.z, gradient.w, t);
  outputColor = vec4(color.rgb * alpha, alpha);
}`;

function resources(gl: WebGL2RenderingContext) {
  const program = gl.createProgram();
  if (!program) {
    throw new Error("GPU vector program allocation failed");
  }
  const shaders: WebGLShader[] = [];
  let buffer: WebGLBuffer | null = null;
  let vao: WebGLVertexArrayObject | null = null;
  let clip: ReturnType<typeof createGpuClip> | undefined;
  try {
    for (const [type, source] of [
      [gl.VERTEX_SHADER, vertex],
      [gl.FRAGMENT_SHADER, fragment],
    ] as const) {
      const shader = gl.createShader(type);
      if (!shader) {
        throw new Error("GPU vector shader allocation failed");
      }
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(
        gl.getProgramInfoLog(program) || "GPU vector program linking failed",
      );
    }
    buffer = gl.createBuffer();
    if (!buffer) {
      throw new Error("GPU vector buffer allocation failed");
    }
    vao = gl.createVertexArray();
    if (!vao) {
      throw new Error("GPU vector vertex array allocation failed");
    }
    const position = gl.getAttribLocation(program, "position");
    if (position < 0) {
      throw new Error("GPU vector position unavailable");
    }
    const uniforms = Object.fromEntries(
      ["viewport", "color", "gradient"].map((name) => {
        const location = gl.getUniformLocation(program, name);
        if (location === null) {
          throw new Error(`GPU vector ${name} unavailable`);
        }
        return [name, location];
      }),
    );
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    clip = createGpuClip(gl, program);
    return { program, buffer, vao, uniforms, clip };
  } catch (error) {
    clip?.dispose();
    if (vao) {
      gl.deleteVertexArray(vao);
    }
    if (buffer) {
      gl.deleteBuffer(buffer);
    }
    gl.deleteProgram(program);
    throw error;
  } finally {
    shaders.forEach((shader) => gl.deleteShader(shader));
  }
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
/** Owns its resources, never the shared canvas/context. Initial allocation failures throw. */
export function createGpuVector(canvas: HTMLCanvasElement) {
  const context = canvas.getContext("webgl2", {
    alpha: true,
    antialias: true,
    stencil: true,
    premultipliedAlpha: true,
  });
  if (!context || !context.getContextAttributes()?.stencil) {
    throw new Error("GPU vector requires WebGL2 with stencil");
  }
  const gl: WebGL2RenderingContext = context;
  const maxSize = gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) as number;
  let current: ReturnType<typeof resources> | undefined = resources(gl);
  let disposed = false;
  let lost = false;
  let latest: { shapes: readonly VectorShape[]; view: VectorView } | undefined;
  let error: string | undefined;

  function render(shapes: readonly VectorShape[], view: VectorView) {
    const r = current!;
    const width = Math.max(1, Math.round(view.width * view.ratio));
    const height = Math.max(1, Math.round(view.height * view.ratio));
    if (canvas.width !== width) {
      canvas.width = width;
    }
    if (canvas.height !== height) {
      canvas.height = height;
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, view.target ?? null);
    gl.viewport(0, 0, width, height);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.disable(gl.SCISSOR_TEST);
    gl.disable(gl.RASTERIZER_DISCARD);
    gl.disable(gl.SAMPLE_ALPHA_TO_COVERAGE);
    gl.disable(gl.SAMPLE_COVERAGE);
    gl.colorMask(true, true, true, true);
    gl.stencilMask(0xff);
    gl.clearStencil(0);
    if (view.clear !== false) {
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
    }
    if (view.clip) {
      const sx = width / view.width,
        sy = height / view.height;
      const x0 = Math.max(0, Math.min(width, Math.round(view.clip.x * sx)));
      const x1 = Math.max(
        x0,
        Math.min(width, Math.round((view.clip.x + view.clip.width) * sx)),
      );
      const y0 = Math.max(0, Math.min(height, Math.round(view.clip.y * sy)));
      const y1 = Math.max(
        y0,
        Math.min(height, Math.round((view.clip.y + view.clip.height) * sy)),
      );
      gl.enable(gl.SCISSOR_TEST);
      gl.scissor(x0, height - y1, x1 - x0, y1 - y0);
    }
    gl.useProgram(r.program);
    r.clip.set(view.clipPolygon, view.width, view.height, width, height);
    gl.bindVertexArray(r.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, r.buffer);
    gl.uniform2f(r.uniforms.viewport, view.width, view.height);
    gl.frontFace(gl.CCW);
    gl.enable(gl.STENCIL_TEST);
    gl.blendEquation(gl.FUNC_ADD);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    const upload = (data: Float32Array, mode: number = gl.TRIANGLES) => {
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STREAM_DRAW);
      gl.drawArrays(mode, 0, data.length / 2);
    };
    const mask = () => {
      gl.stencilMask(0xff);
      gl.clear(gl.STENCIL_BUFFER_BIT);
      gl.disable(gl.BLEND);
      gl.colorMask(false, false, false, false);
      gl.stencilFunc(gl.ALWAYS, 1, 0xff);
    };
    const paint = (
      box: Bounds,
      color: readonly number[],
      opacity: number,
      gradient?: NonNullable<VectorShape["fill"]>["gradient"],
    ) => {
      gl.colorMask(true, true, true, true);
      gl.enable(gl.BLEND);
      gl.stencilMask(0);
      gl.stencilFunc(gl.NOTEQUAL, 0, 0xff);
      gl.stencilOp(gl.KEEP, gl.KEEP, gl.KEEP);
      gl.uniform4f(
        r.uniforms.color,
        color[0],
        color[1],
        color[2],
        color[3] * opacity,
      );
      gl.uniform4f(
        r.uniforms.gradient,
        gradient?.y0 ?? 0,
        gradient?.y1 ?? 1,
        gradient?.startOpacity ?? 1,
        gradient?.endOpacity ?? 1,
      );
      upload(quad(box));
    };
    for (const shape of shapes) {
      const transformed = shape.transform
        ? {
            ...shape,
            contours: shape.contours.map((contour) => ({
              ...contour,
              points: contour.points.map((p) => ({
                x:
                  shape.transform!.a * p.x +
                  shape.transform!.c * p.y +
                  shape.transform!.e,
                y:
                  shape.transform!.b * p.x +
                  shape.transform!.d * p.y +
                  shape.transform!.f,
              })),
            })),
          }
        : shape;
      const box = bounds(transformed, 0);
      if (!box) {
        continue;
      }
      if (shape.fill) {
        mask();
        gl.stencilOpSeparate(gl.FRONT, gl.KEEP, gl.KEEP, gl.INCR_WRAP);
        gl.stencilOpSeparate(gl.BACK, gl.KEEP, gl.KEEP, gl.DECR_WRAP);
        for (const contour of transformed.contours) {
          if (contour.points.length < 3) {
            continue;
          }
          const vertices = new Float32Array(contour.points.length * 2);
          contour.points.forEach((p, i) => {
            vertices[i * 2] = p.x;
            vertices[i * 2 + 1] = p.y;
          });
          upload(vertices, gl.TRIANGLE_FAN);
        }
        paint(box, shape.fill.color, shape.opacity ?? 1, shape.fill.gradient);
      }
      if (shape.stroke && shape.stroke.width > 0) {
        mask();
        gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
        const scale = shape.transform
          ? Math.hypot(
              shape.transform.a,
              shape.transform.b,
              shape.transform.c,
              shape.transform.d,
            )
          : 1;
        const mesh = strokeMesh(shape, view.ratio * scale);
        if (!mesh.length) {
          continue;
        }
        upload(mesh);
        const strokeBounds: Bounds = [Infinity, Infinity, -Infinity, -Infinity];
        for (let i = 0; i < mesh.length; i += 2) {
          strokeBounds[0] = Math.min(strokeBounds[0], mesh[i]);
          strokeBounds[1] = Math.min(strokeBounds[1], mesh[i + 1]);
          strokeBounds[2] = Math.max(strokeBounds[2], mesh[i]);
          strokeBounds[3] = Math.max(strokeBounds[3], mesh[i + 1]);
        }
        paint(strokeBounds, shape.stroke.color, shape.opacity ?? 1);
      }
    }
    gl.colorMask(true, true, true, true);
    gl.stencilMask(0xff);
    gl.disable(gl.STENCIL_TEST);
    gl.disable(gl.SCISSOR_TEST);
    gl.bindVertexArray(null);
  }
  function recover() {
    if (disposed || gl.isContextLost()) {
      return false;
    }
    if (current && !lost) {
      return true;
    }
    try {
      current = resources(gl);
      lost = false;
      error = undefined;
      if (latest && !latest.view.target) {
        render(latest.shapes, latest.view);
      }
      return true;
    } catch (cause) {
      if (current) {
        current.clip.dispose();
        gl.deleteBuffer(current.buffer);
        gl.deleteVertexArray(current.vao);
        gl.deleteProgram(current.program);
        current = undefined;
      }
      error = cause instanceof Error ? cause.message : String(cause);
      return false;
    }
  }
  const onLost = (event: Event) => {
    event.preventDefault();
    lost = true;
    current = undefined;
  };
  const onRestored = () => {
    recover();
  };
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);
  return {
    get available() {
      return !disposed && !lost && !!current && !gl.isContextLost();
    },
    get error() {
      return error;
    },
    draw(shapes: readonly VectorShape[], view: VectorView) {
      if (disposed) {
        return;
      }
      validate(shapes, view, maxSize);
      latest = {
        shapes,
        view: { ...view, clip: view.clip && { ...view.clip } },
      };
      if (lost || gl.isContextLost()) {
        return;
      }
      if (!current) {
        recover();
        return;
      }
      render(shapes, view);
    },
    recover,
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      if (current) {
        current.clip.dispose();
        gl.deleteBuffer(current.buffer);
        gl.deleteVertexArray(current.vao);
        gl.deleteProgram(current.program);
      }
      current = undefined;
      latest = undefined;
    },
  };
}
