import { expect, it, vi } from "vitest";

import { createGpuVector } from "./gpu-vector";

function harness() {
  const gl = {
    createProgram: vi.fn(() => ({})),
    createShader: vi.fn(() => ({})),
    createBuffer: vi.fn(() => ({})),
    createVertexArray: vi.fn(() => ({})),
    deleteProgram: vi.fn(),
    deleteShader: vi.fn(),
    deleteBuffer: vi.fn(),
    deleteVertexArray: vi.fn(),
    getProgramParameter: vi.fn(() => true),
    getAttribLocation: vi.fn(() => 0),
    getUniformLocation: vi.fn(() => ({})),
    getContextAttributes: vi.fn(() => ({ stencil: true, antialias: true })),
    getParameter: vi.fn(() => 16384),
    isContextLost: vi.fn(() => false),
    drawArrays: vi.fn(),
    clear: vi.fn(),
  };
  const context = new Proxy(gl, {
    get: (target, key) =>
      key in target ? target[key as keyof typeof gl] : vi.fn(),
  });
  const canvas = document.createElement("canvas");
  vi.spyOn(canvas, "getContext").mockReturnValue(
    context as unknown as WebGL2RenderingContext,
  );
  return { gl, canvas };
}
const view = { width: 100, height: 100, ratio: 1 };
const shapes = [
  {
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
  },
];
it.each([
  "createProgram",
  "createShader",
  "createBuffer",
  "createVertexArray",
] as const)("cleans every partial allocation when %s fails", (method) => {
  const { gl, canvas } = harness();
  gl[method].mockReturnValueOnce(null as unknown as object);
  expect(() => createGpuVector(canvas)).toThrow(/GPU/);
  for (const [create, remove] of [
    ["createProgram", "deleteProgram"],
    ["createShader", "deleteShader"],
    ["createBuffer", "deleteBuffer"],
    ["createVertexArray", "deleteVertexArray"],
  ] as const) {
    expect(gl[remove]).toHaveBeenCalledTimes(
      gl[create].mock.results.filter((r) => r.value).length,
    );
  }
});
it("rejects invalid frames before clearing the current image", () => {
  const { gl, canvas } = harness();
  const gpu = createGpuVector(canvas);
  gpu.draw(shapes, view);
  gl.clear.mockClear();
  expect(() =>
    gpu.draw(
      [{ ...shapes[0], stroke: { color: [1, 0, 0, 1], width: NaN } }],
      view,
    ),
  ).toThrow(RangeError);
  expect(() => gpu.draw(shapes, { ...view, ratio: Infinity })).toThrow(
    RangeError,
  );
  expect(gl.clear).not.toHaveBeenCalled();
  gpu.dispose();
});
it("recovers atomically, replays only the latest frame, and stops after disposal", () => {
  const { gl, canvas } = harness();
  const gpu = createGpuVector(canvas);
  gpu.draw(shapes, view);
  const lost = new Event("webglcontextlost", { cancelable: true });
  canvas.dispatchEvent(lost);
  expect(lost.defaultPrevented).toBe(true);
  expect(gpu.available).toBe(false);
  gpu.draw([], view);
  gl.createProgram.mockReturnValueOnce(null as unknown as object);
  canvas.dispatchEvent(new Event("webglcontextrestored"));
  expect(gpu.available).toBe(false);
  gl.drawArrays.mockClear();
  gl.clear.mockClear();
  expect(gpu.recover()).toBe(true);
  expect(gl.clear).toHaveBeenCalled();
  expect(gl.drawArrays).not.toHaveBeenCalled();
  gpu.dispose();
  gpu.dispose();
  expect(gpu.recover()).toBe(false);
  expect(gl.deleteProgram).toHaveBeenCalledTimes(1);
});

it("cleans linked resources when a required uniform is missing", () => {
  const { gl, canvas } = harness();
  gl.getUniformLocation.mockReturnValueOnce(null as unknown as object);
  expect(() => createGpuVector(canvas)).toThrow(/GPU/);
  expect(gl.deleteShader).toHaveBeenCalledTimes(2);
  expect(gl.deleteBuffer).toHaveBeenCalledTimes(1);
  expect(gl.deleteVertexArray).toHaveBeenCalledTimes(1);
  expect(gl.deleteProgram).toHaveBeenCalledTimes(1);
});
it("leaves other renderer resources alive when disposing one shared-context instance", () => {
  const { gl, canvas } = harness();
  const a = createGpuVector(canvas);
  const b = createGpuVector(canvas);
  a.dispose();
  expect(b.available).toBe(true);
  b.draw(shapes, view);
  expect(gl.drawArrays).toHaveBeenCalled();
  expect(gl.deleteProgram).toHaveBeenCalledTimes(1);
  b.dispose();
  expect(gl.deleteProgram).toHaveBeenCalledTimes(2);
});

it("releases restored resources when replay fails and can recover again", () => {
  const { gl, canvas } = harness();
  const gpu = createGpuVector(canvas);
  gpu.draw(shapes, view);
  canvas.dispatchEvent(new Event("webglcontextlost", { cancelable: true }));
  gl.drawArrays.mockImplementationOnce(() => {
    throw new Error("upload failed");
  });
  expect(gpu.recover()).toBe(false);
  expect(gpu.available).toBe(false);
  expect(gl.deleteProgram).toHaveBeenCalledTimes(1);
  expect(gpu.recover()).toBe(true);
  expect(gpu.error).toBeUndefined();
  gpu.dispose();
});
