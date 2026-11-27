import { afterEach, expect, it, vi } from "vitest";

import { createGpuVector } from "./gpu-vector";

const harness = vi.hoisted(() => ({ acquire: vi.fn() }));
vi.mock("./webgpu-surface", () => ({ acquireWebGpuSurface: harness.acquire }));
afterEach(() => vi.unstubAllGlobals());
function fixture() {
  vi.stubGlobal("GPUShaderStage", { VERTEX: 1, FRAGMENT: 2 });
  vi.stubGlobal("GPUColorWrite", { ALL: 15 });
  vi.stubGlobal("GPUBufferUsage", { VERTEX: 32, UNIFORM: 64, STORAGE: 128 });
  const buffers: { destroy: ReturnType<typeof vi.fn> }[] = [];
  const pass = {
    setPipeline: vi.fn(),
    setBindGroup: vi.fn(),
    setStencilReference: vi.fn(),
    setVertexBuffer: vi.fn(),
    setScissorRect: vi.fn(),
    draw: vi.fn(),
    end: vi.fn(),
  };
  const encoder = { beginRenderPass: vi.fn(() => pass) };
  const device = {
    limits: { maxTextureDimension2D: 16384 },
    createShaderModule: vi.fn(() => ({})),
    createBindGroupLayout: vi.fn(() => ({})),
    createPipelineLayout: vi.fn(() => ({})),
    createRenderPipeline: vi.fn(
      (_descriptor: GPURenderPipelineDescriptor) => ({}),
    ),
    createBindGroup: vi.fn(() => ({})),
    createBuffer: vi.fn(({ size }: { size: number }) => {
      const buffer = {
        getMappedRange: () => new ArrayBuffer(size),
        unmap: vi.fn(),
        destroy: vi.fn(),
      };
      buffers.push(buffer);
      return buffer;
    }),
  };
  const listeners = new Set<() => void>();
  const surface = {
    device,
    format: "bgra8unorm",
    sampleCount: 4,
    available: true,
    error: undefined as string | undefined,
    ready: Promise.resolve(),
    subscribe: (fn: () => void) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    resize: vi.fn(),
    run: vi.fn((fn: (e: typeof encoder) => void) => fn(encoder)),
    defer: (fn: () => void) => fn(),
    passDescriptor: vi.fn(() => ({})),
    release: vi.fn(),
    recover: vi.fn(() => true),
  };
  harness.acquire.mockReturnValue(surface);
  const gpu = createGpuVector(document.createElement("canvas"));
  return {
    gpu,
    surface,
    device,
    buffers,
    pass,
    encoder,
    notify: () => listeners.forEach((fn) => fn()),
  };
}
const view = { width: 100, height: 100, ratio: 1 };
const shape = {
  contours: [
    {
      points: [
        { x: 0, y: 0 },
        { x: 80, y: 0 },
        { x: 40, y: 80 },
      ],
      closed: true,
    },
  ],
  fill: { color: [1, 0, 0, 1] },
};
it("awaits WebGPU readiness and configures winding, stroke union and premultiplied paint", async () => {
  const { gpu, device, pass, buffers } = fixture();
  await gpu.ready;
  gpu.draw([shape], view);
  const descriptors = device.createRenderPipeline.mock.calls.map(
    (call) => call[0],
  ) as GPURenderPipelineDescriptor[];
  expect(descriptors.map((d) => d.depthStencil?.stencilFront?.passOp)).toEqual([
    "increment-wrap",
    "replace",
    "zero",
  ]);
  expect(descriptors[0].depthStencil?.stencilBack?.passOp).toBe(
    "decrement-wrap",
  );
  expect(descriptors[2].depthStencil?.stencilFront?.compare).toBe("not-equal");
  expect(descriptors.every((d) => d.multisample?.count === 4)).toBe(true);
  expect(pass.draw.mock.calls).toEqual([[3], [6]]);
  expect(
    buffers.every((buffer) => buffer.destroy.mock.calls.length === 1),
  ).toBe(true);
  gpu.dispose();
});
it("rejects invalid frames before touching the current image", async () => {
  const { gpu, encoder } = fixture();
  await gpu.ready;
  gpu.draw([shape], view);
  encoder.beginRenderPass.mockClear();
  expect(() =>
    gpu.draw([{ ...shape, stroke: { color: [1, 0, 0, 1], width: NaN } }], view),
  ).toThrow(RangeError);
  expect(() => gpu.draw([shape], { ...view, ratio: Infinity })).toThrow(
    RangeError,
  );
  expect(encoder.beginRenderPass).not.toHaveBeenCalled();
  gpu.dispose();
});
it("replays only the latest frame after device recovery and stops after disposal", async () => {
  const { gpu, surface, pass, encoder, notify } = fixture();
  await gpu.ready;
  gpu.draw([shape], view);
  surface.available = false;
  notify();
  expect(gpu.available).toBe(false);
  gpu.draw([], view);
  pass.draw.mockClear();
  encoder.beginRenderPass.mockClear();
  surface.available = true;
  notify();
  expect(gpu.available).toBe(true);
  expect(encoder.beginRenderPass).toHaveBeenCalled();
  expect(pass.draw).not.toHaveBeenCalled();
  gpu.dispose();
  gpu.dispose();
  expect(gpu.recover()).toBe(false);
  expect(surface.release).toHaveBeenCalledTimes(1);
});
it("releases partial per-frame allocations when upload fails", async () => {
  const { gpu, device, buffers } = fixture();
  await gpu.ready;
  device.createBuffer
    .mockImplementationOnce(device.createBuffer.getMockImplementation()!)
    .mockImplementationOnce(() => {
      throw new Error("allocation failed");
    });
  expect(() => gpu.draw([shape], view)).toThrow("allocation failed");
  expect(buffers).toHaveLength(1);
  expect(
    buffers.every((buffer) => buffer.destroy.mock.calls.length === 1),
  ).toBe(true);
  gpu.dispose();
});
it("records an unavailable surface without trying to allocate pipeline resources", async () => {
  const { gpu, surface, device, notify } = fixture();
  surface.available = false;
  surface.error = "WebGPU unavailable";
  notify();
  await gpu.ready;
  gpu.draw([shape], view);
  expect(gpu.available).toBe(false);
  expect(gpu.error).toBe("WebGPU unavailable");
  expect(device.createRenderPipeline).not.toHaveBeenCalled();
  gpu.recover();
  expect(surface.recover).toHaveBeenCalledOnce();
  gpu.dispose();
});

it("leaves shared-device peers alive when one renderer is disposed", async () => {
  const { gpu, surface, pass } = fixture();
  const peer = createGpuVector(document.createElement("canvas"));
  await Promise.all([gpu.ready, peer.ready]);
  gpu.dispose();
  expect(peer.available).toBe(true);
  peer.draw([shape], view);
  expect(pass.draw).toHaveBeenCalled();
  expect(surface.release).toHaveBeenCalledTimes(1);
  peer.dispose();
  expect(surface.release).toHaveBeenCalledTimes(2);
});
it("rebuilds pipelines after a transient allocation failure", async () => {
  const { gpu, surface, device, notify } = fixture();
  await gpu.ready;
  surface.available = false;
  notify();
  device.createRenderPipeline.mockImplementationOnce(() => {
    throw new Error("pipeline allocation failed");
  });
  surface.available = true;
  notify();
  expect(gpu.available).toBe(false);
  expect(gpu.error).toBe("pipeline allocation failed");
  expect(gpu.recover()).toBe(true);
  expect(gpu.error).toBeUndefined();
  gpu.dispose();
});

it("batches multiple vector masks and paints into one render pass", async () => {
  const { gpu, encoder, pass } = fixture();
  await gpu.ready;
  gpu.draw(
    [shape, { ...shape, stroke: { color: [0, 0, 1, 0.5], width: 3 } }],
    view,
  );
  expect(encoder.beginRenderPass).toHaveBeenCalledTimes(1);
  expect(pass.draw).toHaveBeenCalledTimes(6);
  expect(pass.end).toHaveBeenCalledTimes(1);
  gpu.dispose();
});
