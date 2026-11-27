import type { GpuTarget, WebGpuSurface } from "./webgpu-surface";

const shader = `
@group(0) @binding(0) var image: texture_2d<f32>;
@group(0) @binding(1) var<uniform> opacity: vec4f;
@vertex fn vertex(@builtin(vertex_index) index: u32) -> @builtin(position) vec4f {
  let p = vec2f(f32((index << 1u) & 2u), f32(index & 2u));
  return vec4f(p * 2 - 1, 0, 1);
}
@fragment fn fragment(@builtin(position) p: vec4f) -> @location(0) vec4f {
  return textureLoad(image, vec2i(p.xy), 0) * opacity.x;
}`;

/** Same-device premultiplied layers, allocated only for opacity isolation. */
export function createGpuCompositor(surface: WebGpuSurface) {
  const layers: GpuTarget[] = [];
  let device: GPUDevice | undefined;
  let pipeline: GPURenderPipeline | undefined;
  let used = 0;
  let width = 0,
    height = 0;
  function reset() {
    layers
      .splice(0)
      .forEach((layer) => surface.defer(() => surface.destroyTarget(layer)));
    pipeline = undefined;
    device = undefined;
  }
  function setup() {
    if (device !== surface.device) {
      reset();
    }
    if (pipeline) {
      return;
    }
    device = surface.device;
    const module = device.createShaderModule({
      code: shader,
      label: "Chart opacity compositor",
    });
    pipeline = device.createRenderPipeline({
      layout: "auto",
      vertex: { module, entryPoint: "vertex" },
      fragment: {
        module,
        entryPoint: "fragment",
        targets: [
          {
            format: surface.format,
            blend: {
              color: { srcFactor: "one", dstFactor: "one-minus-src-alpha" },
              alpha: { srcFactor: "one", dstFactor: "one-minus-src-alpha" },
            },
          },
        ],
      },
      primitive: { topology: "triangle-list" },
      multisample: { count: surface.sampleCount },
      depthStencil: {
        format: "depth24plus-stencil8",
        depthWriteEnabled: false,
        depthCompare: "always",
      },
    });
  }
  return {
    begin(w: number, h: number) {
      if (w !== width || h !== height || device !== surface.device) {
        reset();
      }
      used = 0;
      width = w;
      height = h;
    },
    open(depth: number) {
      setup();
      used = Math.max(used, depth + 1);
      const layer = (layers[depth] ??= surface.createTarget(width, height));
      surface.run((encoder) =>
        encoder
          .beginRenderPass(
            surface.passDescriptor(layer, { clear: true, stencilClear: true }),
          )
          .end(),
      );
      return layer;
    },
    close(depth: number, alpha: number, target: GpuTarget | null) {
      setup();
      const buffer = device!.createBuffer({
        size: 16,
        usage: GPUBufferUsage.UNIFORM,
        mappedAtCreation: true,
      });
      new Float32Array(buffer.getMappedRange()).set([alpha, 0, 0, 0]);
      buffer.unmap();
      try {
        const group = device!.createBindGroup({
          layout: pipeline!.getBindGroupLayout(0),
          entries: [
            { binding: 0, resource: layers[depth].texture.createView() },
            { binding: 1, resource: { buffer } },
          ],
        });
        surface.run((encoder) => {
          surface.resolve(layers[depth], encoder);
          const pass = encoder.beginRenderPass(surface.passDescriptor(target));
          pass.setPipeline(pipeline!);
          pass.setBindGroup(0, group);
          pass.draw(3);
          pass.end();
        });
      } finally {
        surface.defer(() => buffer.destroy());
      }
    },
    end() {
      layers
        .splice(used)
        .forEach((layer) => surface.defer(() => surface.destroyTarget(layer)));
    },
    dispose: reset,
  };
}
