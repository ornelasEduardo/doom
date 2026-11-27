import { acquireWebGpuSurface } from "../../../components/Chart/rendering/webgpu-surface";

/** Reads the persistent resolved texture, preserving premultiplied RGBA values. */
export async function readGpuPixels(
  canvas: HTMLCanvasElement,
  x = 0,
  y = 0,
  width = canvas.width,
  height = canvas.height,
) {
  const surface = acquireWebGpuSurface(canvas);
  try {
    await surface.ready;
    if (!surface.available || !surface.main) {
      throw new Error(surface.error ?? "WebGPU frame unavailable");
    }
    const device = surface.device;
    const bytesPerRow = Math.ceil((width * 4) / 256) * 256;
    const buffer = device.createBuffer({
      size: bytesPerRow * height,
      usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
    });
    try {
      const encoder = device.createCommandEncoder();
      encoder.copyTextureToBuffer(
        { texture: surface.main.texture, origin: [x, y] },
        { buffer, bytesPerRow },
        [width, height],
      );
      device.queue.submit([encoder.finish()]);
      await buffer.mapAsync(GPUMapMode.READ);
      const mapped = new Uint8Array(buffer.getMappedRange());
      const pixels = new Uint8Array(width * height * 4);
      for (let row = 0; row < height; row++) {
        pixels.set(
          mapped.subarray(row * bytesPerRow, row * bytesPerRow + width * 4),
          row * width * 4,
        );
      }
      if (surface.format.startsWith("bgra")) {
        for (let i = 0; i < pixels.length; i += 4) {
          [pixels[i], pixels[i + 2]] = [pixels[i + 2], pixels[i]];
        }
      }
      buffer.unmap();
      return pixels;
    } finally {
      buffer.destroy();
    }
  } finally {
    surface.release();
  }
}
export async function readGpuPixel(
  canvas: HTMLCanvasElement,
  x: number,
  y: number,
) {
  return Array.from(await readGpuPixels(canvas, x, y, 1, 1));
}

export async function readGpuPixelsBottomUp(canvas: HTMLCanvasElement) {
  const pixels = await readGpuPixels(canvas);
  const out = new Uint8Array(pixels.length);
  const stride = canvas.width * 4;
  for (let y = 0; y < canvas.height; y++) {
    out.set(
      pixels.subarray(y * stride, (y + 1) * stride),
      (canvas.height - 1 - y) * stride,
    );
  }
  return out;
}
export async function gpuReady(canvas: HTMLCanvasElement) {
  const surface = acquireWebGpuSurface(canvas);
  try {
    await surface.ready;
    if (!surface.available) {
      throw new Error(surface.error ?? "WebGPU unavailable");
    }
    await new Promise<void>((resolve) =>
      requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
    );
  } finally {
    surface.release();
  }
}
let support: Promise<boolean> | undefined;
export function hasWebGpu() {
  return (support ??= (async () =>
    !!(await navigator.gpu?.requestAdapter()))());
}
