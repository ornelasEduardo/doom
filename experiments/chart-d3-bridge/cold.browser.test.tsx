import { afterEach, expect, it, vi } from "vitest";

import { hasWebGpu } from "../../tests/browser/Chart/webgpu-readback";
import { runCold } from "./cold";

it("completes fresh GPU work and resolves exact compact hover targets", async ({
  skip,
}) => {
  if (!(await hasWebGpu())) {
    skip();
  }
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

function stalledQueue() {
  const done = vi
    .spyOn(GPUQueue.prototype, "onSubmittedWorkDone")
    .mockImplementation(() => new Promise<undefined>(() => {}));
  const destroy = vi.spyOn(GPUDevice.prototype, "destroy");
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 32;
  return { canvas, done, destroy };
}

it("times out and releases GPU resources even when completion stalls", async ({
  skip,
}) => {
  if (!(await hasWebGpu())) {
    skip();
  }
  const { canvas, destroy } = stalledQueue();
  await expect(runCold(canvas, 1, { timeoutMs: 100 })).rejects.toThrow(
    "timed out",
  );
  expect(destroy).toHaveBeenCalledTimes(1);
});

it("cancels in-flight work and releases resources immediately", async ({
  skip,
}) => {
  if (!(await hasWebGpu())) {
    skip();
  }
  const { canvas, done, destroy } = stalledQueue();
  const controller = new AbortController();
  const pending = runCold(canvas, 1, { signal: controller.signal });
  const rejected = expect(pending).rejects.toMatchObject({
    name: "AbortError",
  });
  await expect.poll(() => done.mock.calls.length).toBe(1);
  controller.abort();
  await rejected;
  expect(destroy).toHaveBeenCalledTimes(1);
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
