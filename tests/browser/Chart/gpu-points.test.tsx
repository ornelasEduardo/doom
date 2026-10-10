import { afterEach, expect, it, vi } from "vitest";

import {
  createGpuPoints,
  type GpuView,
} from "../../../components/Chart/rendering/gpu";

const disposers: (() => void)[] = [];
afterEach(() => disposers.splice(0).forEach((dispose) => dispose()));

function fixture(ratio: number, shared = false) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 80 * ratio;
  if (shared) {
    canvas.getContext("webgl2", { antialias: true, stencil: true });
  }
  const gpu = createGpuPoints(canvas);
  disposers.push(() => {
    gpu.dispose();
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  });
  const gl = canvas.getContext("webgl2")!;
  const positions = new Float32Array([0.5, 0.5]);
  const data = { length: 1, buffers: () => ({ positions }) };
  const view: GpuView = {
    width: 80,
    height: 80,
    plotWidth: 60,
    plotHeight: 60,
    k: 1,
    x: 0,
    y: 0,
    matrix: new DOMMatrix().translate(10, 10),
    ratio,
    radius: 8,
    color: [1, 0, 0, 1],
  };
  const pixels = () => {
    const rgba = new Uint8Array(canvas.width * canvas.height * 4);
    gl.readPixels(
      0,
      0,
      canvas.width,
      canvas.height,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      rgba,
    );
    expect(gl.getError()).toBe(gl.NO_ERROR);
    return rgba;
  };
  const pixel = (x: number, y: number) => {
    const rgba = new Uint8Array(4);
    gl.readPixels(
      Math.floor(x * ratio),
      canvas.height - 1 - Math.floor(y * ratio),
      1,
      1,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      rgba,
    );
    return Array.from(rgba);
  };
  return { gpu, canvas, positions, data, view, pixels, pixel };
}

it.each([1, 2])(
  "preserves the default fill and zero-width stroke at DPR %s",
  (ratio) => {
    const { gpu, data, view, pixels, pixel } = fixture(ratio);
    gpu.draw(data, view);
    const filled = pixels();
    expect(pixel(40, 40)).toEqual([255, 0, 0, 255]);
    expect(pixel(46, 40)).toEqual([255, 0, 0, 255]);
    expect(pixel(49, 40)).toEqual([0, 0, 0, 0]);
    gpu.draw(data, { ...view, stroke: { color: [0, 0, 1, 1], width: 0 } });
    expect(pixels()).toEqual(filled);
  },
);

it.each([1, 2])(
  "renders a centered stroke with solid fill and ring, antialiasing only boundaries at DPR %s",
  (ratio) => {
    const { gpu, data, view, pixels, pixel, canvas } = fixture(ratio);
    gpu.draw(data, { ...view, stroke: { color: [0, 0, 1, 1], width: 4 } });
    expect(pixel(40, 40)).toEqual([255, 0, 0, 255]);
    expect(pixel(44, 40)).toEqual([255, 0, 0, 255]);
    expect(pixel(47, 40)).toEqual([0, 0, 255, 255]);
    expect(pixel(48, 40)).toEqual([0, 0, 255, 255]);
    expect(pixel(51, 40)).toEqual([0, 0, 0, 0]);
    const rgba = pixels();
    let partial = 0;
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const offset = (y * canvas.width + x) * 4;
        const distance = Math.hypot(x + 0.5 - 40 * ratio, y + 0.5 - 40 * ratio);
        const pixel = Array.from(rgba.subarray(offset, offset + 4));
        if (distance < 6 * ratio - 0.5) {
          expect(pixel).toEqual([255, 0, 0, 255]);
        }
        if (distance > 6 * ratio + 0.5 && distance < 10 * ratio - 0.5) {
          expect(pixel).toEqual([0, 0, 255, 255]);
        }
        if (distance < 10 * ratio - 0.5) {
          expect(pixel[3]).toBe(255);
        }
        if (distance > 10 * ratio + 0.5) {
          expect(pixel).toEqual([0, 0, 0, 0]);
        }
        if (pixel[3] > 0 && pixel[3] < 255) {
          partial++;
        }
      }
    }
    expect(partial).toBeGreaterThan(0);
  },
);

it.each([1, 2])(
  "clips and patches points whose stroke alone intersects the plot at DPR %s",
  (ratio) => {
    const { gpu, data, positions, view, pixel } = fixture(ratio);
    const stroked = {
      ...view,
      radius: 2,
      stroke: { color: [0, 0, 1, 1], width: 12 },
    };
    positions.set([-0.1, 0.5]);
    gpu.draw(data, stroked);
    expect(pixel(10, 40)).toEqual([0, 0, 255, 255]);
    expect(pixel(9, 40)).toEqual([0, 0, 0, 0]);
    positions.set([-0.5, 0.5]);
    gpu.patch([0]);
    gpu.draw(data, stroked);
    expect(pixel(10, 40)).toEqual([0, 0, 0, 0]);
    positions.set([-0.1, 0.5]);
    gpu.patch([0]);
    gpu.draw(data, stroked);
    expect(pixel(10, 40)).toEqual([0, 0, 255, 255]);
  },
);

it.each([
  { color: [0, 0, 1, 1], width: -1 },
  { color: [0, 0, 1, 1], width: NaN },
  { color: [0, 0, 1, 1], width: Infinity },
  { color: [0, 0, 1, 1], width: 3e38 },
  { color: [0, 0, 1], width: 4 },
  { color: [0, 0, 1, 2], width: 4 },
  { color: [-1, 0, 1, 1], width: 4 },
  { color: [0, NaN, 1, 1], width: 4 },
])("rejects invalid stroke atomically: %j", (stroke) => {
  const { gpu, data, view, pixels, positions, pixel } = fixture(2);
  gpu.draw(data, view);
  const before = pixels();
  positions.set([0.25, 0.5]);
  gpu.patch([0]);
  expect(() =>
    gpu.draw(
      { length: 0, buffers: () => ({ positions: new Float32Array() }) },
      { ...view, stroke },
    ),
  ).toThrow(RangeError);
  expect(pixels()).toEqual(before);
  gpu.draw(data, view);
  expect(pixel(25, 40)).toEqual([255, 0, 0, 255]);
  expect(pixel(40, 40)).toEqual([0, 0, 0, 0]);
});

it("preserves other layers with clear false and restores point rendering state", () => {
  const { gpu, canvas, data, view, pixel } = fixture(1, true);
  gpu.draw(data, view);
  const gl = canvas.getContext("webgl2")!;
  gl.enable(gl.STENCIL_TEST);
  gl.stencilFunc(gl.NEVER, 0, 0xff);
  gl.enable(gl.SCISSOR_TEST);
  gl.scissor(0, 0, 0, 0);
  gl.colorMask(false, false, false, false);
  gl.blendEquation(gl.FUNC_REVERSE_SUBTRACT);
  const other = createGpuPoints(canvas);
  other.draw(data, { ...view, x: 20, color: [0, 1, 0, 1], clear: false });
  expect(pixel(40, 40)).toEqual([255, 0, 0, 255]);
  expect(pixel(60, 40)).toEqual([0, 255, 0, 255]);
  other.dispose();
  expect(gl.isContextLost()).toBe(false);
  gpu.draw(data, view);
  expect(pixel(40, 40)).toEqual([255, 0, 0, 255]);
  expect(pixel(60, 40)).toEqual([0, 0, 0, 0]);
});

it.each([1, 2])(
  "renders and patches per-point radii with centered strokes at DPR %s",
  (ratio) => {
    const { gpu, view, pixel } = fixture(ratio);
    const positions = new Float32Array([0.25, 0.5, 0.75, 0.5]);
    const radii = new Float32Array([2, 8]);
    const data = { length: 2, buffers: () => ({ positions, radii }) };
    const stroked = {
      ...view,
      radius: 1,
      stroke: { color: [0, 0, 1, 1], width: 4 },
    };
    gpu.draw(data, stroked);
    expect(pixel(27, 40)).toEqual([0, 0, 255, 255]);
    expect(pixel(31, 40)).toEqual([0, 0, 0, 0]);
    expect(pixel(59, 40)).toEqual([255, 0, 0, 255]);
    expect(pixel(63, 40)).toEqual([0, 0, 255, 255]);
    radii[0] = 8;
    radii[1] = 2;
    gpu.patch([0, 1]);
    gpu.draw(data, stroked);
    expect(pixel(29, 40)).toEqual([255, 0, 0, 255]);
    expect(pixel(33, 40)).toEqual([0, 0, 255, 255]);
    expect(pixel(61, 40)).toEqual([0, 0, 0, 0]);
    gpu.draw(
      { length: 2, buffers: () => ({ positions }) },
      { ...view, radius: 2 },
    );
    expect(pixel(25, 40)).toEqual([255, 0, 0, 255]);
    expect(pixel(29, 40)).toEqual([0, 0, 0, 0]);
  },
);

it.each([1, 2])(
  "patches changing radii whose previous or next footprint intersects the plot at DPR %s",
  (ratio) => {
    const { gpu, view, pixel } = fixture(ratio);
    const positions = new Float32Array([-0.1, 0.5]);
    const radii = new Float32Array([8]);
    const data = { length: 1, buffers: () => ({ positions, radii }) };
    const small = { ...view, radius: 1 };
    gpu.draw(data, small);
    expect(pixel(10, 40)).toEqual([255, 0, 0, 255]);
    radii[0] = 1;
    gpu.patch([0]);
    gpu.draw(data, small);
    expect(pixel(10, 40)).toEqual([0, 0, 0, 0]);
    radii[0] = 8;
    gpu.patch([0]);
    gpu.draw(data, small);
    expect(pixel(10, 40)).toEqual([255, 0, 0, 255]);
  },
);

it.each(
  [[], [-1], [NaN], [Infinity], [3e38], [1, 2]].map((values) => ({ values })),
)("rejects invalid radii atomically: %j", ({ values }) => {
  const { gpu, data, view, pixels } = fixture(2);
  gpu.draw(data, view);
  const before = pixels();
  const invalid = {
    length: 1,
    buffers: () => ({
      positions: new Float32Array([0.5, 0.5]),
      radii: new Float32Array(values),
    }),
  };
  expect(() => gpu.draw(invalid, view)).toThrow(RangeError);
  expect(pixels()).toEqual(before);
});

it("releases only its resources when another renderer owns the context", () => {
  const { gpu, canvas } = fixture(1);
  const gl = canvas.getContext("webgl2")!;
  gpu.dispose();
  expect(gl.isContextLost()).toBe(false);
});

it("draws to the shared canvas after another backend leaves an offscreen target and sample masks", () => {
  const { gpu, canvas, data, view, pixel } = fixture(1, true);
  const gl = canvas.getContext("webgl2")!;
  const target = gl.createFramebuffer();
  const buffer = gl.createRenderbuffer();
  try {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target);
    gl.bindRenderbuffer(gl.RENDERBUFFER, buffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.RGBA8, 80, 80);
    gl.framebufferRenderbuffer(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.RENDERBUFFER,
      buffer,
    );
    gl.enable(gl.SAMPLE_ALPHA_TO_COVERAGE);
    gl.enable(gl.SAMPLE_COVERAGE);
    gl.sampleCoverage(0, false);
    gpu.draw(data, { ...view, clear: false });
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    expect(pixel(40, 40)).toEqual([255, 0, 0, 255]);
  } finally {
    gl.deleteFramebuffer(target);
    gl.deleteRenderbuffer(buffer);
  }
});

it.each([1, 2])(
  "clips in CSS canvas coordinates and resets the clip on the next layer at DPR %s",
  (ratio) => {
    const { gpu, data, view, pixel } = fixture(ratio);
    gpu.draw(data, view);
    gpu.draw(data, {
      ...view,
      color: [0, 1, 0, 1],
      clear: false,
      clip: { x: 40, y: 30, width: 20, height: 10 },
    });
    expect(pixel(44, 36)).toEqual([0, 255, 0, 255]);
    expect(pixel(36, 36)).toEqual([255, 0, 0, 255]);
    expect(pixel(44, 44)).toEqual([255, 0, 0, 255]);
    gpu.draw(data, { ...view, color: [0, 0, 1, 1] });
    expect(pixel(36, 36)).toEqual([0, 0, 255, 255]);
    expect(pixel(44, 44)).toEqual([0, 0, 255, 255]);
  },
);

it.each([1, 2])(
  "intersects clips extending beyond the framebuffer at DPR %s",
  (ratio) => {
    const { gpu, data, view, pixel, pixels } = fixture(ratio);
    gpu.draw(data, {
      ...view,
      clip: { x: -100, y: -100, width: 140, height: 140 },
    });
    expect(pixel(36, 36)).toEqual([255, 0, 0, 255]);
    expect(pixel(44, 36)).toEqual([0, 0, 0, 0]);
    expect(pixel(36, 44)).toEqual([0, 0, 0, 0]);
    gpu.draw(data, {
      ...view,
      clip: { x: 40, y: 40, width: 100, height: 100 },
    });
    expect(pixel(44, 44)).toEqual([255, 0, 0, 255]);
    expect(pixel(36, 44)).toEqual([0, 0, 0, 0]);
    expect(pixel(44, 36)).toEqual([0, 0, 0, 0]);
    pixels();
  },
);

it.each(
  [1, 2].flatMap((ratio) =>
    [
      { x: 40, y: 40, width: 0, height: 20 },
      { x: 40, y: 40, width: 20, height: 0 },
      { x: -20, y: 0, width: 10, height: 80 },
      { x: 80, y: 0, width: 10, height: 80 },
      { x: 0, y: -20, width: 80, height: 10 },
      { x: 0, y: 80, width: 80, height: 10 },
      { x: Number.MAX_VALUE, y: 0, width: 0, height: 80 },
    ].map((clip) => ({ ratio, clip })),
  ),
)("draws nothing for an empty clip intersection: %j", ({ ratio, clip }) => {
  const { gpu, data, view, pixels } = fixture(ratio);
  gpu.draw(data, { ...view, clip });
  expect(pixels().some((channel) => channel !== 0)).toBe(false);
});

it.each([
  { x: NaN, y: 0, width: 80, height: 80 },
  { x: 0, y: Infinity, width: 80, height: 80 },
  { x: 0, y: 0, width: -1, height: 80 },
  { x: 0, y: 0, width: 80, height: -1 },
  { x: 0, y: 0, width: Infinity, height: 80 },
  { x: 0, y: 0, width: 80, height: NaN },
  { x: Number.MAX_VALUE, y: 0, width: Number.MAX_VALUE, height: 80 },
])(
  "rejects invalid clips before changing pixels or pending patches: %j",
  (clip) => {
    const { gpu, data, view, positions, pixels, pixel } = fixture(2);
    gpu.draw(data, view);
    const before = pixels();
    positions.set([0.25, 0.5]);
    gpu.patch([0]);
    expect(() => gpu.draw(data, { ...view, clip })).toThrow(RangeError);
    expect(pixels()).toEqual(before);
    gpu.draw(data, view);
    expect(pixel(25, 40)).toEqual([255, 0, 0, 255]);
    expect(pixel(40, 40)).toEqual([0, 0, 0, 0]);
  },
);

it.each([1, 2])(
  "dims points and strokes with sparse emphasis updates at DPR %s",
  (ratio) => {
    const { gpu, canvas, view, pixel } = fixture(ratio);
    const positions = new Float32Array([0.25, 0.5, 0.75, 0.5]);
    const radii = new Float32Array([8, 8]);
    const data = {
      immutable: true as const,
      length: 2,
      buffers: () => ({ positions, radii }),
    };
    const stroked = { ...view, stroke: { color: [0, 0, 1, 1], width: 4 } };
    gpu.draw(data, stroked);
    const gl = canvas.getContext("webgl2")!;
    const uploads = vi.spyOn(gl, "bufferData");
    const patches = vi.spyOn(gl, "bufferSubData");
    const dimmed = (rgba: number[], channel: number) => {
      expect(rgba[3]).toBeGreaterThanOrEqual(63);
      expect(rgba[3]).toBeLessThanOrEqual(65);
      expect(rgba[channel]).toBe(rgba[3]);
    };
    try {
      gpu.draw(data, {
        ...stroked,
        emphasis: { indices: [0, 0], opacity: 0.25 },
      });
      expect(pixel(25, 40)).toEqual([255, 0, 0, 255]);
      dimmed(pixel(55, 40), 0);
      dimmed(pixel(63, 40), 2);
      expect(uploads).toHaveBeenCalledTimes(1);
      expect(uploads).toHaveBeenLastCalledWith(
        gl.ARRAY_BUFFER,
        8,
        gl.DYNAMIC_DRAW,
      );
      expect(patches).toHaveBeenCalledTimes(1);
      expect(patches.mock.calls[0][1]).toBe(0);
      expect(Array.from(patches.mock.calls[0][2] as Float32Array)).toEqual([2]);
      uploads.mockClear();
      patches.mockClear();
      gpu.draw(data, { ...stroked, emphasis: { indices: [1], opacity: 0.25 } });
      dimmed(pixel(25, 40), 0);
      expect(pixel(55, 40)).toEqual([255, 0, 0, 255]);
      expect(pixel(63, 40)).toEqual([0, 0, 255, 255]);
      expect(uploads).not.toHaveBeenCalled();
      expect(
        patches.mock.calls.map((call) => [
          call[1],
          ...Array.from(call[2] as Float32Array),
        ]),
      ).toEqual([
        [0, 0],
        [4, 2],
      ]);
      patches.mockClear();
      gpu.draw(data, {
        ...stroked,
        emphasis: { indices: [1, 1], opacity: 0.5 },
      });
      expect(patches).not.toHaveBeenCalled();
      expect(pixel(25, 40)[3]).toBeGreaterThanOrEqual(127);
      expect(pixel(25, 40)[3]).toBeLessThanOrEqual(129);
      gpu.draw(data, stroked);
      expect(pixel(25, 40)).toEqual([255, 0, 0, 255]);
      expect(pixel(55, 40)).toEqual([255, 0, 0, 255]);
      expect(uploads).not.toHaveBeenCalled();
      expect(
        patches.mock.calls.map((call) => [
          call[1],
          ...Array.from(call[2] as Float32Array),
        ]),
      ).toEqual([[4, 0]]);
      gpu.draw(data, { ...stroked, emphasis: { indices: [], opacity: 0 } });
      expect(pixel(25, 40)).toEqual([0, 0, 0, 0]);
      expect(pixel(55, 40)).toEqual([0, 0, 0, 0]);
    } finally {
      uploads.mockRestore();
      patches.mockRestore();
    }
  },
);

it("resets emphasis flags when replacing the source", () => {
  const { gpu, view, pixel } = fixture(1);
  const positions = new Float32Array([0.25, 0.5, 0.75, 0.5]);
  const data = { length: 2, buffers: () => ({ positions }) };
  gpu.draw(data, { ...view, emphasis: { indices: [0], opacity: 0 } });
  expect(pixel(25, 40)).toEqual([255, 0, 0, 255]);
  gpu.draw({ ...data }, { ...view, emphasis: { indices: [1], opacity: 0 } });
  expect(pixel(25, 40)).toEqual([0, 0, 0, 0]);
  expect(pixel(55, 40)).toEqual([255, 0, 0, 255]);
});

it.each([
  { indices: [-1], opacity: 0.5 },
  { indices: [1], opacity: 0.5 },
  { indices: [0.5], opacity: 0.5 },
  { indices: [NaN], opacity: 0.5 },
  { indices: [Infinity], opacity: 0.5 },
  { indices: [0], opacity: -1 },
  { indices: [0], opacity: 2 },
  { indices: [0], opacity: NaN },
  { indices: [0], opacity: Infinity },
])(
  "rejects invalid emphasis without changing pixels or uploads: %j",
  (emphasis) => {
    const { gpu, canvas, data, view, pixels } = fixture(1);
    gpu.draw(data, view);
    const before = pixels();
    const gl = canvas.getContext("webgl2")!;
    const uploads = vi.spyOn(gl, "bufferData");
    const patches = vi.spyOn(gl, "bufferSubData");
    try {
      expect(() => gpu.draw(data, { ...view, emphasis })).toThrow(RangeError);
      expect(pixels()).toEqual(before);
      expect(uploads).not.toHaveBeenCalled();
      expect(patches).not.toHaveBeenCalled();
    } finally {
      uploads.mockRestore();
      patches.mockRestore();
    }
  },
);

it("applies composed opacity overrides after selected indices and removes stale overrides", () => {
  const { gpu, view, pixel } = fixture(1);
  const positions = new Float32Array([0.25, 0.5, 0.5, 0.5, 0.75, 0.5]);
  const data = { length: 3, buffers: () => ({ positions }) };
  gpu.draw(data, {
    ...view,
    radius: 3,
    emphasis: {
      indices: [0, 1],
      opacity: 0.25,
      overrides: [
        { index: 0, opacity: 0 },
        { index: 1, opacity: 0.6 },
      ],
    },
  });
  expect(pixel(25, 40)).toEqual([0, 0, 0, 0]);
  expect(pixel(40, 40)[3]).toBeGreaterThanOrEqual(152);
  expect(pixel(40, 40)[3]).toBeLessThanOrEqual(154);
  expect(pixel(40, 40)[0]).toBe(pixel(40, 40)[3]);
  expect(pixel(55, 40)[3]).toBeGreaterThanOrEqual(63);
  expect(pixel(55, 40)[3]).toBeLessThanOrEqual(65);
  gpu.draw(data, {
    ...view,
    radius: 3,
    emphasis: { indices: [0], opacity: 0.25 },
  });
  expect(pixel(25, 40)).toEqual([255, 0, 0, 255]);
  expect(pixel(40, 40)[3]).toBeGreaterThanOrEqual(63);
  expect(pixel(40, 40)[3]).toBeLessThanOrEqual(65);
});

it.each([
  { index: -1, opacity: 0.6 },
  { index: 1, opacity: 0.6 },
  { index: 0.5, opacity: 0.6 },
  { index: 0, opacity: -1 },
  { index: 0, opacity: 2 },
  { index: 0, opacity: NaN },
  { index: 0, opacity: Infinity },
])("rejects invalid opacity overrides atomically: %j", (override) => {
  const { gpu, canvas, data, view, pixels } = fixture(1);
  gpu.draw(data, view);
  const before = pixels();
  const gl = canvas.getContext("webgl2")!;
  const patches = vi.spyOn(gl, "bufferSubData");
  try {
    expect(() =>
      gpu.draw(data, {
        ...view,
        emphasis: {
          indices: [0],
          opacity: 0.25,
          overrides: [override],
        },
      }),
    ).toThrow(RangeError);
    expect(pixels()).toEqual(before);
    expect(patches).not.toHaveBeenCalled();
  } finally {
    patches.mockRestore();
  }
});
