import { expect, it, vi } from "vitest";

import { createGpuPoints, type GpuView } from "./gpu";

// WebGL is unavailable in the unit lane; record its resource and upload boundary.
function harness() {
  const gl = {
    VERTEX_SHADER: 1,
    FRAGMENT_SHADER: 2,
    LINK_STATUS: 3,
    createProgram: vi.fn(() => ({})),
    createShader: vi.fn(() => ({})),
    createBuffer: vi.fn(() => ({})),
    createVertexArray: vi.fn(() => ({})),
    deleteProgram: vi.fn(),
    deleteShader: vi.fn(),
    deleteBuffer: vi.fn(),
    deleteVertexArray: vi.fn(),
    getProgramParameter: vi.fn(() => true),
    getProgramInfoLog: vi.fn(() => ""),
    getShaderInfoLog: vi.fn(() => ""),
    getAttribLocation: vi.fn(() => 0),
    getUniformLocation: vi.fn(() => ({})),
    isContextLost: vi.fn(() => false),
    getExtension: vi.fn(() => null),
    bufferData: vi.fn(),
    bufferSubData: vi.fn(),
    drawArrays: vi.fn(),
  };
  const context = new Proxy(gl, {
    get(target, key) {
      return key in target ? target[key as keyof typeof target] : vi.fn();
    },
  });
  const canvas = document.createElement("canvas");
  vi.spyOn(canvas, "getContext").mockReturnValue(
    context as unknown as WebGL2RenderingContext,
  );
  return { gl, canvas };
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
  return { length: positions.length / 2, buffers: () => ({ positions }) };
}

it.each([
  "createProgram",
  "createShader",
  "createBuffer",
  "createVertexArray",
] as const)(
  "rejects failed %s allocations and releases everything already allocated",
  (method) => {
    const { gl, canvas } = harness();
    gl[method].mockReturnValueOnce(null as unknown as object);
    expect(() => createGpuPoints(canvas)).toThrow(/GPU/);
    for (const [create, remove] of [
      ["createProgram", "deleteProgram"],
      ["createShader", "deleteShader"],
      ["createBuffer", "deleteBuffer"],
      ["createVertexArray", "deleteVertexArray"],
    ] as const) {
      const allocated = gl[create].mock.results.filter(
        (result) => result.value,
      );
      expect(gl[remove]).toHaveBeenCalledTimes(allocated.length);
    }
  },
);
it("cleans up a partially allocated second buffer and reports empty link logs", () => {
  const { gl, canvas } = harness();
  gl.createBuffer
    .mockReturnValueOnce({})
    .mockReturnValueOnce(null as unknown as object);
  expect(() => createGpuPoints(canvas)).toThrow(/GPU/);
  expect(gl.deleteBuffer).toHaveBeenCalledTimes(1);
  expect(gl.deleteVertexArray).toHaveBeenCalledTimes(1);
  gl.getProgramParameter.mockReturnValue(false);
  expect(() => createGpuPoints(canvas)).toThrow(/linking failed/);
});
it("retries resource creation after failed restoration and reuploads the latest source", () => {
  const { gl, canvas } = harness();
  const gpu = createGpuPoints(canvas);
  const data = source();
  gpu.draw(data, view);
  canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
  gl.createProgram.mockReturnValueOnce(null as unknown as object);
  canvas.dispatchEvent(new Event("webglcontextrestored"));
  gpu.draw(data, view);
  expect(gl.bufferData).toHaveBeenCalledTimes(2);
  expect(gl.drawArrays).toHaveBeenCalledTimes(2);
  gpu.dispose();
  gpu.dispose();
  expect(gl.deleteBuffer).toHaveBeenCalledTimes(2);
});
it.each([
  {
    axes: {
      x: { type: "linear", domain: [-3e38, 3e38] },
      y: { type: "linear", domain: [0, 1] },
    },
  },
  { width: 0 },
  { ratio: NaN },
  { radius: -1 },
  { color: [1, 0, 0] },
  {
    density: {
      positions: new Float32Array(2),
      counts: new Float32Array(2),
      cells: 1,
    },
  },
  {
    density: {
      positions: new Float32Array(2),
      counts: new Float32Array([-1]),
      cells: 1,
    },
  },
])(
  "rejects invalid draw input before uploading or changing the latest frame: %j",
  (invalid) => {
    const { gl, canvas } = harness();
    const gpu = createGpuPoints(canvas);
    expect(() =>
      gpu.draw(source(), { ...view, ...invalid } as GpuView),
    ).toThrow(RangeError);
    expect(gl.bufferData).not.toHaveBeenCalled();
    expect(() => gpu.patch([0])).toThrow(/existing slots/);
    gpu.dispose();
  },
);
it("rejects a source whose length exceeds its buffer", () => {
  const { gl, canvas } = harness();
  const gpu = createGpuPoints(canvas);
  expect(() => gpu.draw({ ...source(), length: 2 }, view)).toThrow(RangeError);
  expect(gl.bufferData).not.toHaveBeenCalled();
  gpu.dispose();
});
it("coalesces visible patches and retains offscreen patches until their viewport is shown", () => {
  const { gl, canvas } = harness();
  const gpu = createGpuPoints(canvas);
  const data = source([0.1, 0.1, 0.2, 0.2, 0.8, 0.8]);
  gpu.draw(data, { ...view, k: 2 });
  data.buffers().positions.set([0.15, 0.15, 0.25, 0.25, 0.9, 0.9]);
  gpu.patch([0, 1, 2]);
  gpu.draw(data, { ...view, k: 2 });
  expect(gl.bufferSubData).toHaveBeenCalledTimes(1);
  expect(gl.bufferSubData.mock.calls[0].slice(1)).toEqual([
    0,
    new Float32Array([0.15, 0.15, 0.25, 0.25]),
  ]);
  expect(canvas.dataset.gpuDirty).toBe("1");
  gpu.draw(data, view);
  expect(gl.bufferSubData).toHaveBeenCalledTimes(2);
  expect(canvas.dataset.gpuDirty).toBe("0");
  expect(gl.bufferData).toHaveBeenCalledTimes(1);
  gpu.dispose();
});

it("replays the newest frame after context loss and releases restored resources once", () => {
  const { gl, canvas } = harness();
  const gpu = createGpuPoints(canvas);
  gpu.draw(source(), view);
  gl.isContextLost.mockReturnValue(true);
  const lost = new Event("webglcontextlost", { cancelable: true });
  canvas.dispatchEvent(lost);
  expect(lost.defaultPrevented).toBe(true);
  const newest = source([0.75, 0.75]);
  gpu.draw(newest, view);
  expect(gl.drawArrays).toHaveBeenCalledTimes(1);
  gl.isContextLost.mockReturnValue(false);
  canvas.dispatchEvent(new Event("webglcontextrestored"));
  expect(gl.bufferData.mock.calls[1][1]).toEqual(newest.buffers().positions);
  expect(gl.drawArrays).toHaveBeenCalledTimes(2);
  gpu.dispose();
  gpu.dispose();
  canvas.dispatchEvent(new Event("webglcontextrestored"));
  gpu.draw(newest, view);
  expect(gl.createProgram).toHaveBeenCalledTimes(2);
  expect(gl.deleteProgram).toHaveBeenCalledTimes(1);
  expect(gl.deleteBuffer).toHaveBeenCalledTimes(2);
});
it("uploads patches moving out of view and reads the source buffer once per draw", () => {
  const { gl, canvas } = harness();
  const gpu = createGpuPoints(canvas);
  const data = source([0.1, 0.1, 0.2, 0.2]);
  const buffers = vi.spyOn(data, "buffers");
  gpu.draw(data, view);
  data.buffers().positions.set([2, 2, 3, 3]);
  buffers.mockClear();
  gpu.patch([0, 1]);
  gpu.draw(data, view);
  expect(buffers).toHaveBeenCalledTimes(1);
  expect(gl.bufferSubData).toHaveBeenCalledTimes(1);
  expect(canvas.dataset.gpuDirty).toBe("0");
  gpu.dispose();
});

it("rejects a density point diameter that overflows GPU precision before upload", () => {
  const { gl, canvas } = harness();
  const gpu = createGpuPoints(canvas);
  expect(() =>
    gpu.draw(source(), {
      ...view,
      ratio: 1e37,
      density: {
        positions: new Float32Array([0.5, 0.5]),
        counts: new Float32Array([1]),
        cells: 1,
      },
    }),
  ).toThrow(RangeError);
  expect(gl.bufferData).not.toHaveBeenCalled();
  gpu.dispose();
});

it("does not accept legacy object rows or perform implicit coordinate conversion", () => {
  const { gl, canvas } = harness();
  const gpu = createGpuPoints(canvas);
  expect(() => {
    // @ts-expect-error The renderer accepts compact numeric sources only.
    gpu.draw([{ requests: 10, latency: 100 }], view);
  }).toThrow(TypeError);
  expect(gl.bufferData).not.toHaveBeenCalled();
  gpu.dispose();
});
it("borrows immutable interleaved coordinates without conversion or copying", () => {
  const { gl, canvas } = harness();
  const gpu = createGpuPoints(canvas);
  const data = { ...source([-5, 100, 5, 10]), immutable: true as const };
  gpu.draw(data, {
    ...view,
    axes: {
      x: { type: "linear", domain: [-10, 10] },
      y: { type: "log", domain: [1000, 1] },
    },
  });
  expect(gl.bufferData.mock.calls[0][1]).toBe(data.buffers().positions);
  expect(Array.from(data.buffers().positions)).toEqual([-5, 100, 5, 10]);
  expect(() => gpu.patch([0])).toThrow(/immutable/i);
  gpu.dispose();
});

it("reports loss and restoration without notifying during normal draws", () => {
  const { gl, canvas } = harness();
  const onStatusChange = vi.fn();
  const gpu = createGpuPoints(canvas, { onStatusChange });
  const data = source();
  expect(gpu.available).toBe(true);
  gpu.draw(data, view);
  gpu.draw(data, view);
  expect(onStatusChange).not.toHaveBeenCalled();
  gl.isContextLost.mockReturnValue(true);
  expect(gpu.available).toBe(false);
  canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
  expect(onStatusChange).toHaveBeenCalledTimes(1);
  gl.isContextLost.mockReturnValue(false);
  expect(gpu.available).toBe(false);
  canvas.dispatchEvent(new Event("webglcontextrestored"));
  expect(gpu.available).toBe(true);
  expect(gpu.error).toBeUndefined();
  expect(onStatusChange).toHaveBeenCalledTimes(2);
  gpu.draw(data, view);
  expect(onStatusChange).toHaveBeenCalledTimes(2);
  gpu.dispose();
  expect(gpu.available).toBe(false);
});
it("exposes restoration failure and clears it after successful draw retry", () => {
  const { gl, canvas } = harness();
  const onStatusChange = vi.fn();
  const gpu = createGpuPoints(canvas, { onStatusChange });
  gpu.draw(source(), view);
  canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
  gl.createProgram.mockReturnValueOnce(null as unknown as object);
  canvas.dispatchEvent(new Event("webglcontextrestored"));
  expect(gpu.available).toBe(false);
  expect(gpu.error).toMatch(/GPU program allocation failed/);
  expect(onStatusChange).toHaveBeenCalledTimes(2);
  gpu.draw(source(), view);
  expect(gpu.available).toBe(true);
  expect(gpu.error).toBeUndefined();
  expect(canvas.dataset.gpuError).toBeUndefined();
  expect(onStatusChange).toHaveBeenCalledTimes(3);
  gpu.dispose();
});
it("does not classify a restoration subscriber exception as a GPU failure", () => {
  const { canvas } = harness();
  const subscribe = vi.spyOn(canvas, "addEventListener");
  const failure = new Error("subscriber failed");
  const onStatusChange = vi.fn();
  const gpu = createGpuPoints(canvas, { onStatusChange });
  gpu.draw(source(), view);
  canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
  onStatusChange.mockImplementation(() => {
    throw failure;
  });
  // Invoke the event boundary directly: DOM dispatch reports exceptions globally.
  const restored = subscribe.mock.calls.find(
    ([name]) => name === "webglcontextrestored",
  )![1] as EventListener;
  expect(() => restored(new Event("webglcontextrestored"))).toThrow(failure);
  expect(gpu.available).toBe(true);
  expect(gpu.error).toBeUndefined();
  expect(canvas.dataset.gpuError).toBeUndefined();
  gpu.dispose();
});
it("restores availability before the first frame exists", () => {
  const { canvas } = harness();
  const onStatusChange = vi.fn();
  const gpu = createGpuPoints(canvas, { onStatusChange });
  canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
  expect(gpu.available).toBe(false);
  canvas.dispatchEvent(new Event("webglcontextrestored"));
  expect(gpu.available).toBe(true);
  expect(onStatusChange).toHaveBeenCalledTimes(2);
  gpu.dispose();
});

it("explicitly recovers returned contexts once per call without scheduling notifications", () => {
  const { gl, canvas } = harness();
  const onStatusChange = vi.fn();
  const gpu = createGpuPoints(canvas, { onStatusChange });
  expect(gpu.recover()).toBe(true);
  expect(gl.createProgram).toHaveBeenCalledTimes(1);
  canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
  gl.isContextLost.mockReturnValue(true);
  expect(gpu.recover()).toBe(false);
  expect(gl.createProgram).toHaveBeenCalledTimes(1);
  gl.isContextLost.mockReturnValue(false);
  onStatusChange.mockClear();
  gl.createProgram.mockReturnValueOnce(null as unknown as object);
  expect(gpu.recover()).toBe(false);
  expect(gl.createProgram).toHaveBeenCalledTimes(2);
  expect(gpu.available).toBe(false);
  expect(gpu.error).toMatch(/allocation failed/);
  gl.createProgram.mockReturnValueOnce(null as unknown as object);
  expect(gpu.recover()).toBe(false);
  expect(gl.createProgram).toHaveBeenCalledTimes(3);
  expect(onStatusChange).not.toHaveBeenCalled();
  expect(gpu.recover()).toBe(true);
  expect(gl.createProgram).toHaveBeenCalledTimes(4);
  expect(gpu.available).toBe(true);
  expect(gpu.error).toBeUndefined();
  expect(canvas.dataset.gpuError).toBeUndefined();
  expect(onStatusChange).not.toHaveBeenCalled();
  gpu.draw(source(), view);
  expect(gl.drawArrays).toHaveBeenCalledTimes(1);
  expect(gpu.recover()).toBe(true);
  expect(gl.createProgram).toHaveBeenCalledTimes(4);
  expect(onStatusChange).not.toHaveBeenCalled();
  gpu.dispose();
  expect(gpu.recover()).toBe(false);
  expect(gl.createProgram).toHaveBeenCalledTimes(4);
});
