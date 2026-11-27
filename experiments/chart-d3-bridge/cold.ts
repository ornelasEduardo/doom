import { createGpuPoints } from "../../components/Chart/rendering/gpu";
import { acquireWebGpuSurface } from "../../components/Chart/rendering/webgpu-surface";
import { createCompactData, nearestCompact } from "./compact";

export async function runCold(
  canvas: HTMLCanvasElement,
  count = 1000000,
  {
    signal,
    timeoutMs = 10000,
  }: { signal?: AbortSignal; timeoutMs?: number } = {},
) {
  signal?.throwIfAborted();
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || timeoutMs > 60000) {
    throw new RangeError("GPU timeout must be between 0 and 60,000 ms");
  }
  const start = performance.now();
  const grid = createCompactData(count);
  const prepared = performance.now();
  const gpu = createGpuPoints(canvas);
  const surface = acquireWebGpuSurface(canvas);
  let disposed = false;
  const dispose = () => {
    if (disposed) {
      return;
    }
    disposed = true;
    gpu.dispose();
    surface.release();
  };
  let timer: ReturnType<typeof setTimeout> | undefined;
  let abort: (() => void) | undefined;
  const cancelled = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error("GPU completion timed out")),
      timeoutMs,
    );
    abort = () =>
      reject(signal?.reason ?? new DOMException("Aborted", "AbortError"));
    signal?.addEventListener("abort", abort, { once: true });
    if (signal?.aborted) {
      abort();
    }
  });
  try {
    await Promise.race([gpu.ready, cancelled]);
    if (!gpu.available) {
      throw new Error(gpu.error ?? "WebGPU unavailable");
    }
    const initialized = performance.now();
    const positions = new Float32Array(grid.coordinates);
    gpu.draw(
      { length: count, immutable: true, buffers: () => ({ positions }) },
      {
        width: canvas.width,
        height: canvas.height,
        plotWidth: canvas.width,
        plotHeight: canvas.height,
        k: 1,
        x: 0,
        y: 0,
        matrix: new DOMMatrix(),
        ratio: 1,
        radius: 0.5,
        color: [0.63, 0.29, 0.98, 1],
      },
    );
    const submitted = performance.now();
    await Promise.race([surface.device.queue.onSubmittedWorkDone(), cancelled]);
    if (!gpu.available) {
      throw new Error(gpu.error ?? "GPU completion failed");
    }
    const completed = performance.now();
    const info = surface.device.adapterInfo;
    return {
      timings: {
        preparationMs: prepared - start,
        initializationMs: initialized - prepared,
        uploadAndSubmitMs: submitted - initialized,
        // Kept for the proof consumer; this is completed wall time, not an isolated GPU timestamp.
        gpuCompletionAtFrameMs: completed - start,
      },
      backend:
        `WebGPU ${info.vendor} ${info.architecture} ${info.description}`.trim(),
      point: (index: number) => {
        if (!Number.isInteger(index) || index < 0 || index >= count) {
          throw new RangeError("Point index out of range");
        }
        return {
          index,
          x: grid.coordinates[index * 2],
          y: grid.coordinates[index * 2 + 1],
        };
      },
      nearest: (x: number, y: number, radius: number, scaleX = 1, scaleY = 1) =>
        nearestCompact(grid, x, y, radius, scaleX, scaleY),
      dispose,
    };
  } catch (error) {
    dispose();
    throw error;
  } finally {
    clearTimeout(timer);
    if (abort) {
      signal?.removeEventListener("abort", abort);
    }
  }
}
