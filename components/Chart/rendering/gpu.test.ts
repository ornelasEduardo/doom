import { beforeEach, expect, it, vi } from "vitest";

import { createGpuPoints, type GpuView } from "./gpu";

const state = vi.hoisted(() => ({ surface: undefined as unknown }));
vi.mock("./webgpu-surface", () => ({
  acquireWebGpuSurface: () => state.surface,
}));
function harness() {
  vi.stubGlobal("GPUBufferUsage", {
    STORAGE: 128,
    COPY_DST: 8,
    UNIFORM: 64,
    VERTEX: 32,
  });
  const writes: {
    label: string;
    offset: number;
    values: number[];
    buffer: ArrayBuffer;
  }[] = [];
  const buffers: { label: string; destroy: ReturnType<typeof vi.fn> }[] = [];
  const pass = {
    setPipeline: vi.fn(),
    setVertexBuffer: vi.fn(),
    setBindGroup: vi.fn(),
    setScissorRect: vi.fn(),
    draw: vi.fn(),
    end: vi.fn(),
  };
  const device = {
    createShaderModule: vi.fn(),
    createRenderPipeline: vi.fn(() => ({ getBindGroupLayout: vi.fn() })),
    createBindGroup: vi.fn(),
    createBuffer: vi.fn(({ label }: { label: string }) => {
      const buffer = { label, destroy: vi.fn() };
      buffers.push(buffer);
      return buffer;
    }),
    queue: {
      writeBuffer: vi.fn(
        (
          buffer: { label: string },
          offset: number,
          data: ArrayBuffer,
          byteOffset: number,
          byteLength: number,
        ) =>
          writes.push({
            label: buffer.label,
            offset,
            values: Array.from(
              new Float32Array(data, byteOffset, byteLength / 4),
            ),
            buffer: data,
          }),
      ),
    },
  };
  let listener = () => {};
  const surface = {
    device,
    writeBuffer: (
      buffer: { label: string },
      offset: number,
      data: Float32Array,
    ) =>
      device.queue.writeBuffer(
        buffer,
        offset,
        data.buffer as ArrayBuffer,
        data.byteOffset,
        data.byteLength,
      ),
    format: "rgba8unorm",
    ready: Promise.resolve(),
    available: true,
    error: undefined as string | undefined,
    subscribe: (fn: () => void) => {
      listener = fn;
      return vi.fn();
    },
    recover: vi.fn(() => false),
    release: vi.fn(),
    passDescriptor: vi.fn(),
    defer: (fn: () => void) => fn(),
    run: (fn: (encoder: unknown) => void) =>
      fn({ beginRenderPass: () => pass }),
  };
  state.surface = surface;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 100;
  return {
    canvas,
    device,
    writes,
    buffers,
    pass,
    surface,
    notify: () => listener(),
  };
}
const view: GpuView = {
  width: 100,
  height: 100,
  plotWidth: 100,
  plotHeight: 100,
  k: 1,
  x: 0,
  y: 0,
  matrix: { a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 } as DOMMatrix,
  ratio: 1,
  radius: 3,
  color: [1, 0, 0, 1],
};
function source(values = [0.25, 0.25]) {
  const positions = new Float32Array(values);
  return {
    length: positions.length / 2,
    buffers: vi.fn(() => ({ positions })),
  };
}
beforeEach(() => vi.clearAllMocks());
it("uses four-vertex instanced quads and per-draw uniforms without reuploading retained sources", async () => {
  const h = harness(),
    gpu = createGpuPoints(h.canvas),
    data = source();
  await gpu.ready;
  gpu.draw(data, view);
  gpu.draw(data, { ...view, x: 1 });
  expect(h.pass.draw).toHaveBeenLastCalledWith(4, 1);
  expect(h.writes.filter((w) => w.label === "Chart point buffer")).toHaveLength(
    1,
  );
  expect(
    h.buffers.filter((b) => b.label === "Chart point draw uniforms"),
  ).toHaveLength(2);
  expect(data.buffers).toHaveBeenCalledTimes(1);
  gpu.dispose();
});
it("borrows immutable buffers and rejects patching them", async () => {
  const h = harness(),
    gpu = createGpuPoints(h.canvas),
    data = { ...source(), immutable: true as const };
  await gpu.ready;
  gpu.draw(data, view);
  expect(h.writes.find((w) => w.label === "Chart point buffer")!.buffer).toBe(
    data.buffers().positions.buffer,
  );
  expect(() => gpu.patch([0])).toThrow(/Immutable/);
  gpu.dispose();
});
it("coalesces visible patches and retains offscreen edits until they enter the viewport", async () => {
  const h = harness(),
    gpu = createGpuPoints(h.canvas),
    data = source([0.1, 0.1, 0.2, 0.2, 0.8, 0.8]);
  await gpu.ready;
  gpu.draw(data, { ...view, k: 2 });
  data.buffers().positions.set([0.15, 0.15, 0.25, 0.25, 0.9, 0.9]);
  gpu.patch([0, 1, 2]);
  gpu.draw(data, { ...view, k: 2 });
  expect(h.writes.filter((w) => w.label === "Chart point buffer")).toHaveLength(
    2,
  );
  expect(
    h.writes.filter((w) => w.label === "Chart point buffer")[1].values,
  ).toEqual(Array.from(new Float32Array([0.15, 0.15, 0.25, 0.25])));
  expect(h.canvas.dataset.gpuDirty).toBe("1");
  gpu.draw(data, view);
  expect(h.canvas.dataset.gpuDirty).toBe("0");
  gpu.dispose();
});
it("uploads moved-out patches and sparse emphasis changes only", async () => {
  const h = harness(),
    gpu = createGpuPoints(h.canvas),
    data = source([0.1, 0.1, 0.2, 0.2]);
  await gpu.ready;
  gpu.draw(data, { ...view, emphasis: { indices: [0], opacity: 0.1 } });
  data.buffers().positions.set([3, 3]);
  gpu.patch([0]);
  gpu.draw(data, { ...view, emphasis: { indices: [1], opacity: 0.1 } });
  expect(
    h.writes.filter((w) => w.label === "Chart point buffer")[1].values,
  ).toEqual([3, 3]);
  expect(
    h.writes
      .filter((w) => w.label === "Chart point emphasis")
      .map((w) => [w.offset, w.values]),
  ).toEqual([
    [0, [2]],
    [0, [0]],
    [4, [2]],
  ]);
  gpu.dispose();
});
it("retains density weights until the frame identity changes", async () => {
  const h = harness(),
    gpu = createGpuPoints(h.canvas),
    data = source();
  await gpu.ready;
  const density = {
    positions: new Float32Array([0.5, 0.5]),
    counts: new Float32Array([4]),
    cells: 10,
  };
  gpu.draw(data, { ...view, density });
  gpu.draw(data, { ...view, density, x: 2 });
  expect(
    h.writes.filter((w) => w.label === "Chart point weights"),
  ).toHaveLength(1);
  expect(h.canvas.dataset.gpuDetail).toBe("density");
  gpu.dispose();
});
it("queues the newest draw before initialization and reuploads after device recovery", async () => {
  const h = harness();
  h.surface.available = false;
  const gpu = createGpuPoints(h.canvas),
    data = source();
  gpu.draw(data, view);
  gpu.draw(data, { ...view, x: 7 });
  expect(h.pass.draw).not.toHaveBeenCalled();
  h.surface.available = true;
  await gpu.ready;
  expect(h.pass.draw).toHaveBeenCalledTimes(1);
  h.surface.available = false;
  h.notify();
  expect(gpu.available).toBe(false);
  h.surface.available = true;
  h.notify();
  expect(gpu.available).toBe(true);
  expect(h.writes.filter((w) => w.label === "Chart point buffer")).toHaveLength(
    2,
  );
  gpu.dispose();
  gpu.dispose();
  expect(h.surface.release).toHaveBeenCalledTimes(1);
});
it.each([
  { width: 0 },
  { ratio: NaN },
  { radius: -1 },
  { color: [1, 0, 0] },
  { opacity: 2 },
  { pointTransform: [Infinity, 0, 0, 1] },
  {
    axes: {
      x: { type: "linear", domain: [-3e38, 3e38] },
      y: { type: "linear", domain: [0, 1] },
    },
  },
  {
    density: {
      positions: new Float32Array(2),
      counts: new Float32Array([-1]),
      cells: 1,
    },
  },
  { emphasis: { indices: [2], opacity: 1 } },
  { stroke: { width: -1, color: [0, 0, 0, 1] } },
])("rejects invalid draw before upload: %j", (invalid) => {
  const h = harness(),
    gpu = createGpuPoints(h.canvas);
  expect(() => gpu.draw(source(), { ...view, ...invalid } as GpuView)).toThrow(
    RangeError,
  );
  expect(h.writes).toHaveLength(0);
  expect(() => gpu.patch([0])).toThrow(/existing slots/);
  gpu.dispose();
});
it("rejects inconsistent source buffers and overflowing density diameter", () => {
  const h = harness(),
    gpu = createGpuPoints(h.canvas);
  expect(() => gpu.draw({ ...source(), length: 2 }, view)).toThrow(RangeError);
  expect(() =>
    gpu.draw(source(), {
      ...view,
      plotWidth: 3e38,
      plotHeight: 3e38,
      ratio: 2,
      density: {
        positions: new Float32Array([0.5, 0.5]),
        counts: new Float32Array([1]),
        cells: 1,
      },
    }),
  ).toThrow(/diameter/);
  gpu.dispose();
});

it("exposes setup failure and recovers without scheduling a retry loop", async () => {
  const h = harness();
  h.device.createRenderPipeline.mockImplementationOnce(() => {
    throw new Error("pipeline unavailable");
  });
  const onStatusChange = vi.fn();
  const renderer = createGpuPoints(h.canvas, { onStatusChange });
  await renderer.ready;
  expect(renderer.available).toBe(false);
  expect(renderer.error).toBe("pipeline unavailable");
  expect(renderer.recover()).toBe(true);
  expect(renderer.error).toBeUndefined();
  expect(onStatusChange).not.toHaveBeenCalled();
  renderer.dispose();
});

it("releases per-draw allocations if bind group creation fails", async () => {
  const h = harness();
  const renderer = createGpuPoints(h.canvas);
  await renderer.ready;
  h.device.createBindGroup.mockImplementationOnce(() => {
    throw new Error("bind group unavailable");
  });
  expect(() => renderer.draw(source(), view)).toThrow("bind group unavailable");
  const transient = h.buffers.filter((buffer) =>
    ["Chart point draw uniforms", "Chart point clip edges"].includes(
      buffer.label,
    ),
  );
  expect(transient).toHaveLength(2);
  transient.forEach((buffer) =>
    expect(buffer.destroy).toHaveBeenCalledTimes(1),
  );
  renderer.dispose();
});
