import { gpuReady, readGpuPixelsBottomUp } from "./webgpu-readback";

/** CPU snapshot preserving the existing bottom-left pixel-coordinate assertions. */
export async function snapshotGpu(canvas: HTMLCanvasElement) {
  await gpuReady(canvas);
  const pixels = await readGpuPixelsBottomUp(canvas);
  const stride = canvas.width * 4;
  return {
    RGBA: 0,
    UNSIGNED_BYTE: 0,
    readPixels(
      x: number,
      y: number,
      width: number,
      height: number,
      _format: number,
      _type: number,
      output: Uint8Array,
    ) {
      for (let row = 0; row < height; row++) {
        const offset = (y + row) * stride + x * 4;
        output.set(
          pixels.subarray(offset, offset + width * 4),
          row * width * 4,
        );
      }
    },
  };
}
