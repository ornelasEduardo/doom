const vertex = `#version 300 es
in vec2 position;
in float weight;
out float intensity;
uniform float maxWeight;
uniform vec2 viewport;
uniform vec2 plot;
uniform vec3 zoom;
uniform mat3 matrix;
uniform highp float diameter;
uniform vec3 xAxis;
uniform vec3 yAxis;
float project(float value, vec3 axis) {
  return ((axis.z > 0.5 ? log(value) / log(10.0) : value) - axis.x) / (axis.y - axis.x);
}
void main() {
  intensity = maxWeight > 0.0 ? 0.15 + 0.85 * log(1.0 + weight) / log(1.0 + maxWeight) : 1.0;
  // Invalid coordinates never enter projection or rasterization.
  if (any(isnan(position)) || any(isinf(position))) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 1.0;
    return;
  }
  if ((xAxis.z > 0.5 && position.x <= 0.0) || (yAxis.z > 0.5 && position.y <= 0.0)) {
    gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
    gl_PointSize = 1.0;
    return;
  }
  vec2 projected = vec2(project(position.x, xAxis), project(position.y, yAxis));
  vec2 local = projected * plot * zoom.z + zoom.xy;
  vec2 pixel = (matrix * vec3(local, 1.0)).xy;
  gl_Position = vec4(pixel.x / viewport.x * 2.0 - 1.0, 1.0 - pixel.y / viewport.y * 2.0, 0.0, 1.0);
  if (any(lessThan(local, vec2(0.0))) || any(greaterThan(local, plot))) gl_Position = vec4(2.0,2.0,2.0,1.0);
  gl_PointSize = diameter + 2.0;
}`;
const fragment = `#version 300 es
precision mediump float;
uniform vec4 color;
uniform highp float diameter;
in float intensity;
out vec4 outputColor;
void main() {
  // One device-pixel coverage ramp; output uses premultiplied alpha.
  float distance = length((gl_PointCoord - vec2(0.5)) * (diameter + 2.0));
  float coverage = clamp(diameter * 0.5 + 0.5 - distance, 0.0, 1.0);
  if (coverage == 0.0) discard;
  float alpha = color.a * coverage;
  outputColor = vec4(color.rgb * intensity * alpha, alpha);
}`;

export function createGpuResources(context: WebGL2RenderingContext) {
  const program = context.createProgram();
  if (!program) {
    throw new Error("GPU program allocation failed");
  }
  const shaders: WebGLShader[] = [];
  let buffer: WebGLBuffer | null = null;
  let weights: WebGLBuffer | null = null;
  let vao: WebGLVertexArrayObject | null = null;
  try {
    for (const [type, source] of [
      [context.VERTEX_SHADER, vertex],
      [context.FRAGMENT_SHADER, fragment],
    ] as const) {
      const shader = context.createShader(type);
      if (!shader) {
        throw new Error("GPU shader allocation failed");
      }
      shaders.push(shader);
      context.shaderSource(shader, source);
      context.compileShader(shader);
      context.attachShader(program, shader);
    }
    // Query the linked program once instead of synchronizing per shader.
    context.linkProgram(program);
    if (!context.getProgramParameter(program, context.LINK_STATUS)) {
      const detail = [
        context.getProgramInfoLog(program),
        ...shaders.map((shader) => context.getShaderInfoLog(shader)),
      ]
        .filter(Boolean)
        .join("\n");
      throw new Error(detail || "GPU program linking failed");
    }
    buffer = context.createBuffer();
    if (!buffer) {
      throw new Error("GPU position buffer allocation failed");
    }
    vao = context.createVertexArray();
    if (!vao) {
      throw new Error("GPU vertex array allocation failed");
    }
    context.bindVertexArray(vao);
    context.bindBuffer(context.ARRAY_BUFFER, buffer);
    const attribute = context.getAttribLocation(program, "position");
    const weightAttribute = context.getAttribLocation(program, "weight");
    if (attribute < 0 || weightAttribute < 0) {
      throw new Error("GPU program attributes are unavailable");
    }
    context.enableVertexAttribArray(attribute);
    context.vertexAttribPointer(attribute, 2, context.FLOAT, false, 0, 0);
    weights = context.createBuffer();
    if (!weights) {
      throw new Error("GPU weight buffer allocation failed");
    }
    const uniforms = Object.fromEntries(
      [
        "viewport",
        "plot",
        "zoom",
        "matrix",
        "diameter",
        "color",
        "maxWeight",
        "xAxis",
        "yAxis",
      ].map((name) => {
        const location = context.getUniformLocation(program, name);
        if (location === null) {
          throw new Error(`GPU uniform ${name} is unavailable`);
        }
        return [name, location];
      }),
    );
    return { program, buffer, vao, uniforms, weights, weightAttribute };
  } catch (error) {
    if (buffer) {
      context.deleteBuffer(buffer);
    }
    if (weights) {
      context.deleteBuffer(weights);
    }
    if (vao) {
      context.deleteVertexArray(vao);
    }
    context.deleteProgram(program);
    throw error;
  } finally {
    for (const shader of shaders) {
      context.deleteShader(shader);
    }
  }
}
