/** All point geometry uses four-vertex instanced quads, including tiny circles. */
const shader = `
struct Uniforms { v: array<vec4f, 17> }
@group(0) @binding(0) var<uniform> u: Uniforms;
@group(0) @binding(2) var<storage, read> radii: array<f32>;
@group(0) @binding(3) var<storage, read> weights: array<f32>;
@group(0) @binding(4) var<storage, read> emphasis: array<f32>;
@group(0) @binding(5) var<storage, read> edges: array<vec4f>;
struct Output {
 @builtin(position) position: vec4f,
 @location(0) @interpolate(flat) center: vec2f,
 @location(1) @interpolate(flat) diameter: f32,
 @location(2) @interpolate(flat) intensity: f32,
 @location(3) @interpolate(flat) opacity: f32,
}
fn project(value: f32, axis: vec4f) -> f32 {
 var x = value;
 if (axis.z > 0.5) { x = log(value) / log(10.0); }
 return (x - axis.x) / (axis.y - axis.x);
}
@vertex fn vertex(@builtin(vertex_index) vertex: u32, @builtin(instance_index) instance: u32, @location(0) p: vec2f) -> Output {
 var out: Output;
 var radius = u.v[12].x;
 if (u.v[12].y > 0.5) { radius = radii[instance]; }
 out.diameter = radius * 2.0 * u.v[9].x + u.v[9].z;
 out.intensity = 1.0;
 if (u.v[12].z > 0.0) { out.intensity = 0.15 + 0.85 * log(1.0 + weights[instance]) / log(1.0 + u.v[12].z); }
 out.opacity = u.v[9].w;
 if (u.v[12].w > 0.5 && emphasis[instance] > 0.0) { out.opacity = emphasis[instance] - 1.0; }
 let local = vec2f(project(p.x,u.v[2]), project(p.y,u.v[3])) * u.v[1].xy * u.v[1].z + u.v[4].xy;
 out.center = vec2f(dot(u.v[5].xyz, vec3f(local,1)), dot(u.v[6].xyz, vec3f(local,1)));
 let corners = array<vec2f,4>(vec2f(-1,-1),vec2f(1,-1),vec2f(-1,1),vec2f(1,1));
 let delta = corners[vertex] * (out.diameter * u.v[9].y + 2.0) / u.v[0].zw;
 out.position = vec4f(out.center / u.v[0].xy * vec2f(2,-2) + vec2f(-1,1) + delta * vec2f(1,-1),0,1);
 // SVG circles with a zero radius do not paint, even when a stroke is set.
 // IEEE non-finite coordinates fail these comparisons without entering rasterization.
 if (radius <= 0.0 || !(abs(p.x) <= 3.402823e38) || !(abs(p.y) <= 3.402823e38) ||
     any(local < -u.v[15].xy) || any(local > u.v[1].xy + u.v[15].xy) ||
     (u.v[2].z > 0.5 && p.x <= 0.0) || (u.v[3].z > 0.5 && p.y <= 0.0) || u.v[9].y == 0.0) {
   out.position = vec4f(2,2,2,1);
 }
 return out;
}
@fragment fn fragment(in: Output) -> @location(0) vec4f {
 let pixel = in.position.xy * u.v[0].xy / u.v[0].zw;
 let local = vec2f(dot(u.v[7].xyz,vec3f(pixel,1)),dot(u.v[8].xyz,vec3f(pixel,1)));
 if (u.v[8].w == 0.0 || any(local < vec2f(0)) || any(local > u.v[1].xy)) { discard; }
 if (u.v[16].x < 0.0) { discard; }
 for (var i = 0u; i < u32(u.v[16].x); i++) {
   if (dot(edges[i].xy,pixel) + edges[i].z < -0.00001) { discard; }
 }
 let delta = (pixel - in.center) * u.v[0].zw / u.v[0].xy;
 var distance = length(delta);
 var ramp = 1.0;
 if (u.v[14].x > 0.5) {
   let inverse = mat2x2f(u.v[13].xy,u.v[13].zw);
   let circle = inverse * delta;
   distance = length(circle);
   var normal = vec2f(1,0);
   if (distance > 0.0) { normal = circle / distance; }
   ramp = max(length(transpose(inverse) * normal),0.000001);
 }
 let coverage = clamp((in.diameter * 0.5 - distance) / ramp + 0.5,0.0,1.0);
 if (coverage == 0.0) { discard; }
 let radius = (in.diameter - u.v[9].z) * 0.5;
 let fillCoverage = clamp((radius - distance) / ramp + 0.5,0.0,1.0);
 var strokeCoverage = 0.0;
 if (u.v[9].z > 0.0) { strokeCoverage = coverage - clamp((radius - u.v[9].z * 0.5 - distance) / ramp + 0.5,0.0,1.0); }
 let strokeAlpha = u.v[11].a * strokeCoverage;
 let fillAlpha = u.v[10].a * fillCoverage * (1.0 - strokeAlpha);
 return vec4f((u.v[10].rgb * fillAlpha + u.v[11].rgb * strokeAlpha) * in.intensity,fillAlpha + strokeAlpha) * in.opacity * u.v[14].y;
}`;

export function createGpuResources(
  device: GPUDevice,
  format: GPUTextureFormat,
  sampleCount = 4,
) {
  const module = device.createShaderModule({
    code: shader,
    label: "Chart point quads",
  });
  const pipeline = device.createRenderPipeline({
    label: "Chart point quads",
    layout: "auto",
    vertex: {
      module,
      entryPoint: "vertex",
      buffers: [
        {
          arrayStride: 8,
          stepMode: "instance",
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
          blend: {
            color: { srcFactor: "one", dstFactor: "one-minus-src-alpha" },
            alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha" },
          },
        },
      ],
    },
    primitive: { topology: "triangle-strip" },
    depthStencil: {
      format: "depth24plus-stencil8",
      depthWriteEnabled: false,
      depthCompare: "always",
    },
    multisample: { count: sampleCount },
  });
  return {
    pipeline,
    buffer: undefined as GPUBuffer | undefined,
    radii: undefined as GPUBuffer | undefined,
    weights: undefined as GPUBuffer | undefined,
    emphasis: undefined as GPUBuffer | undefined,
  };
}
