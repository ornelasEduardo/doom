import { expect, it, vi } from "vitest";

import { createGpuClip } from "./gpu-clip";

function fixture() {
  const gl = {
    TEXTURE0: 0,
    TEXTURE1: 1,
    TEXTURE_2D: 2,
    getUniformLocation: vi.fn(() => ({})),
    createTexture: vi.fn(() => ({})),
    deleteTexture: vi.fn(),
    activeTexture: vi.fn(),
    bindTexture: vi.fn(),
    getParameter: vi.fn(() => 4096),
    texParameteri: vi.fn(),
    texImage2D: vi.fn(),
    uniform1i: vi.fn(),
    uniform4f: vi.fn(),
  };
  const clip = createGpuClip(
    gl as unknown as WebGL2RenderingContext,
    {} as WebGLProgram,
  );
  return { gl, clip };
}
it("uploads changed coordinates even when the caller reuses its polygon", () => {
  const { gl, clip } = fixture();
  const polygon = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
    { x: 0, y: 10 },
  ];
  clip.set(polygon, 100, 100, 100, 100);
  polygon[1].x = 20;
  polygon[2].x = 20;
  clip.set(polygon, 100, 100, 100, 100);
  expect(gl.texImage2D).toHaveBeenCalledTimes(2);
  clip.set(
    polygon.map((point) => ({ ...point })),
    100,
    100,
    100,
    100,
  );
  expect(gl.texImage2D).toHaveBeenCalledTimes(2);
  clip.dispose();
  expect(gl.deleteTexture).toHaveBeenCalledTimes(1);
});
it("restores the active texture unit when an upload fails", () => {
  const { gl, clip } = fixture();
  gl.texImage2D.mockImplementationOnce(() => {
    throw new Error("upload failed");
  });
  expect(() => clip.set(undefined, 100, 100, 100, 100)).toThrow(
    "upload failed",
  );
  expect(gl.activeTexture).toHaveBeenLastCalledWith(gl.TEXTURE0);
  clip.set(undefined, 100, 100, 100, 100);
  expect(gl.texImage2D).toHaveBeenCalledTimes(2);
  clip.dispose();
  expect(gl.deleteTexture).toHaveBeenCalledTimes(1);
});

it("rejects all fragments for a direct zero-area polygon", () => {
  const { gl, clip } = fixture();
  clip.set(
    Array.from({ length: 4 }, () => ({ x: 20, y: 20 })),
    100,
    100,
    100,
    100,
  );
  expect(gl.uniform1i).toHaveBeenCalledWith(expect.anything(), -1);
  clip.dispose();
});
