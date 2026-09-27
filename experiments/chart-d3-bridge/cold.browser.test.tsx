import { afterEach, expect, it, vi } from "vitest";

import { runCold } from "./cold";

it("completes fresh GPU work and resolves exact compact hover targets", async () => {
  const canvas = document.createElement("canvas");
  canvas.width = 500;
  canvas.height = 200;
  document.body.append(canvas);
  let result: Awaited<ReturnType<typeof runCold>> | undefined;
  try {
    result = await runCold(canvas, 1000);
    const point = result.point(123);
    expect(result.nearest(point.x, point.y, 0)).toBe(123);
    expect(result.timings.gpuCompletionAtFrameMs).toBeGreaterThanOrEqual(
      result.timings.preparationMs +
        result.timings.initializationMs +
        result.timings.uploadAndSubmitMs,
    );
  } finally {
    result?.dispose();
    canvas.remove();
  }
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function stalledCanvas() {
  const gl = {
    createProgram: () => ({}),
    createShader: () => ({}),
    shaderSource() {},
    compileShader() {},
    getShaderParameter: () => true,
    attachShader() {},
    deleteShader: vi.fn(),
    linkProgram() {},
    getProgramParameter: () => true,
    useProgram() {},
    createBuffer: () => ({}),
    bindBuffer() {},
    bufferData() {},
    getAttribLocation: () => 0,
    enableVertexAttribArray() {},
    vertexAttribPointer() {},
    viewport() {},
    clearColor() {},
    clear() {},
    drawArrays() {},
    fenceSync: () => ({}),
    flush() {},
    getError: () => 0,
    NO_ERROR: 0,
    deleteSync: vi.fn(),
    deleteBuffer: vi.fn(),
    deleteProgram: vi.fn(),
    getExtension: () => null,
  };
  const canvas = document.createElement("canvas");
  vi.spyOn(canvas, "getContext").mockReturnValue(
    gl as unknown as WebGL2RenderingContext,
  );
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn(() => 1),
  );
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  return { canvas, gl };
}

it("times out and releases GPU resources even when animation frames stop", async () => {
  vi.useFakeTimers();
  const { canvas, gl } = stalledCanvas();
  const pending = runCold(canvas, 1, { timeoutMs: 25 });
  const rejected = expect(pending).rejects.toThrow("timed out");
  await vi.advanceTimersByTimeAsync(25);
  await rejected;
  expect(gl.deleteSync).toHaveBeenCalledTimes(1);
  expect(gl.deleteBuffer).toHaveBeenCalledTimes(1);
  expect(gl.deleteProgram).toHaveBeenCalledTimes(1);
  expect(cancelAnimationFrame).toHaveBeenCalledWith(1);
  expect(vi.getTimerCount()).toBe(0);
});

it("cancels in-flight work and releases resources immediately", async () => {
  const { canvas, gl } = stalledCanvas();
  const controller = new AbortController();
  const pending = runCold(canvas, 1, { signal: controller.signal });
  controller.abort();
  await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  expect(gl.deleteSync).toHaveBeenCalledTimes(1);
  expect(gl.deleteProgram).toHaveBeenCalledTimes(1);
});

it("cancels an already aborted run before allocating a context", async () => {
  const canvas = document.createElement("canvas");
  const context = vi.spyOn(canvas, "getContext");
  const controller = new AbortController();
  controller.abort();
  await expect(
    runCold(canvas, 1, { signal: controller.signal }),
  ).rejects.toMatchObject({ name: "AbortError" });
  expect(context).not.toHaveBeenCalled();
});
