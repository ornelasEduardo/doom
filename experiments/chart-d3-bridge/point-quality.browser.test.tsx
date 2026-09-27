import { expect, it } from "vitest";

import { createGpuPoints } from "./gpu";

it.each([1, 2])(
  "smooths only the circle boundary at pixel ratio %s",
  (ratio) => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 32 * ratio;
    const gpu = createGpuPoints(canvas);
    const gl = canvas.getContext("webgl2")!;
    const positions = new Float32Array([0.5, 0.5]);
    try {
      gpu.draw(
        { length: 1, buffers: () => ({ positions }) },
        {
          width: 32,
          height: 32,
          plotWidth: 32,
          plotHeight: 32,
          k: 1,
          x: 0,
          y: 0,
          matrix: new DOMMatrix(),
          ratio,
          radius: 3,
          color: [1, 0, 0, 1],
        },
      );
      const pixels = new Uint8Array(canvas.width * canvas.height * 4);
      gl.readPixels(
        0,
        0,
        canvas.width,
        canvas.height,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        pixels,
      );
      let partial = 0;
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const offset = (y * canvas.width + x) * 4;
          const alpha = pixels[offset + 3];
          const distance = Math.hypot(
            x + 0.5 - 16 * ratio,
            y + 0.5 - 16 * ratio,
          );
          if (distance < 3 * ratio - 0.5) {
            expect(alpha).toBe(255);
          }
          if (distance > 3 * ratio + 0.5) {
            expect(alpha).toBe(0);
          }
          if (alpha > 0 && alpha < 255) {
            partial++;
          }
          // Independent fixed-point channel rounding can differ by one byte.
          expect(Math.abs(pixels[offset] - alpha)).toBeLessThanOrEqual(1);
        }
      }
      expect(partial).toBeGreaterThan(0);
      expect(gl.getError()).toBe(gl.NO_ERROR);
    } finally {
      gpu.dispose();
    }
  },
);

it("composites translucent overlapping dots without dark fringes", () => {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 32;
  const gpu = createGpuPoints(canvas);
  const gl = canvas.getContext("webgl2")!;
  const positions = new Float32Array([0.5, 0.5, 0.5, 0.5]);
  try {
    gpu.draw(
      { length: 2, buffers: () => ({ positions }) },
      {
        width: 32,
        height: 32,
        plotWidth: 32,
        plotHeight: 32,
        k: 1,
        x: 0,
        y: 0,
        matrix: new DOMMatrix(),
        ratio: 1,
        radius: 3,
        color: [1, 0, 0, 0.5],
      },
    );
    const pixel = new Uint8Array(4);
    gl.readPixels(16, 16, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    expect(pixel[3]).toBeGreaterThanOrEqual(190);
    expect(pixel[3]).toBeLessThanOrEqual(193);
    expect(pixel[0]).toBe(pixel[3]);
    expect(pixel[1]).toBe(0);
    expect(pixel[2]).toBe(0);
  } finally {
    gpu.dispose();
  }
});
