import { vi } from "vitest";

/** Observe copies at the WebGPU boundary without depending on private resources. */
export function trackPointUploads() {
  const calls: { buffer: GPUBuffer; offset: number; values: Float32Array }[] =
    [];
  const original = GPUQueue.prototype.writeBuffer;
  const spy = vi
    .spyOn(GPUQueue.prototype, "writeBuffer")
    .mockImplementation(function (
      this: GPUQueue,
      ...args: Parameters<GPUQueue["writeBuffer"]>
    ) {
      const [buffer, offset, data, dataOffset = 0, size] = args;
      if (buffer.label === "Chart point buffer") {
        const view = ArrayBuffer.isView(data)
          ? new Uint8Array(data.buffer, data.byteOffset, data.byteLength)
          : new Uint8Array(data);
        const elementSize =
          ArrayBuffer.isView(data) && "BYTES_PER_ELEMENT" in data
            ? Number(data.BYTES_PER_ELEMENT)
            : 1;
        const bytes = view.slice(
          dataOffset * elementSize,
          size === undefined ? undefined : (dataOffset + size) * elementSize,
        );
        calls.push({ buffer, offset, values: new Float32Array(bytes.buffer) });
      }
      original.apply(this, args);
    });
  return { calls, restore: () => spy.mockRestore() };
}
