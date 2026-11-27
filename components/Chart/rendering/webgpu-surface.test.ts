import { expect, it, vi } from "vitest";

import { acquireWebGpuSurface } from "./webgpu-surface";

it("reports missing WebGPU without an unhandled initialization rejection", async () => {
  const canvas = document.createElement("canvas");
  const surface = acquireWebGpuSurface(canvas);
  await surface.ready;
  expect(surface.available).toBe(false);
  expect(surface.error).toContain("WebGPU");
  surface.release();
});

it("shares ownership until the last client releases a canvas", async () => {
  const canvas = document.createElement("canvas");
  const a = acquireWebGpuSurface(canvas);
  const b = acquireWebGpuSurface(canvas);
  expect(a).toBe(b);
  await a.ready;
  const changed = vi.fn();
  a.subscribe(changed);
  a.release();
  expect(acquireWebGpuSurface(canvas)).toBe(b);
  b.release();
  b.release();
  const fresh = acquireWebGpuSurface(canvas);
  expect(fresh === a).toBe(false);
  fresh.release();
});

it("releases a partially configured device and retries transient configuration failure", async () => {
  vi.stubGlobal("GPUTextureUsage", { RENDER_ATTACHMENT: 16, COPY_DST: 2 });
  const devices = Array.from({ length: 2 }, () => ({
    destroy: vi.fn(),
    addEventListener: vi.fn(),
    lost: new Promise(() => {}),
  }));
  const requestDevice = vi
    .fn()
    .mockResolvedValueOnce(devices[0])
    .mockResolvedValueOnce(devices[1]);
  vi.stubGlobal("navigator", {
    gpu: {
      requestAdapter: vi.fn(async () => ({ requestDevice })),
      getPreferredCanvasFormat: () => "rgba8unorm",
    },
  });
  const canvas = document.createElement("canvas");
  const configure = vi.fn().mockImplementationOnce(() => {
    throw new Error("configuration unavailable");
  });
  const unconfigure = vi.fn();
  vi.spyOn(canvas, "getContext").mockReturnValue({
    configure,
    unconfigure,
  } as unknown as GPUCanvasContext);
  const surface = acquireWebGpuSurface(canvas);
  try {
    await surface.ready;
    expect(surface.available).toBe(false);
    expect(surface.error).toContain("configuration unavailable");
    expect(devices[0].destroy).toHaveBeenCalledTimes(1);
    surface.recover();
    await surface.ready;
    expect(surface.available).toBe(true);
    expect(surface.error).toBeUndefined();
    expect(requestDevice).toHaveBeenCalledTimes(2);
  } finally {
    surface.release();
    vi.unstubAllGlobals();
  }
});

it("retires an errored device and its targets on explicit recovery", async () => {
  vi.stubGlobal("GPUTextureUsage", {
    RENDER_ATTACHMENT: 16,
    COPY_DST: 2,
    COPY_SRC: 1,
    TEXTURE_BINDING: 4,
  });
  const listeners: ((event: { error: { message: string } }) => void)[] = [];
  const textures: { destroy: ReturnType<typeof vi.fn> }[] = [];
  const devices = Array.from({ length: 2 }, () => ({
    destroy: vi.fn(),
    addEventListener: vi.fn(
      (
        _type: string,
        listener: (event: { error: { message: string } }) => void,
      ) => listeners.push(listener),
    ),
    lost: new Promise(() => {}),
    limits: { maxTextureDimension2D: 8192 },
    createTexture: vi.fn(() => {
      const texture = { destroy: vi.fn() };
      textures.push(texture);
      return texture;
    }),
  }));
  const requestDevice = vi
    .fn()
    .mockResolvedValueOnce(devices[0])
    .mockResolvedValueOnce(devices[1]);
  vi.stubGlobal("navigator", {
    gpu: {
      requestAdapter: vi.fn(async () => ({ requestDevice })),
      getPreferredCanvasFormat: () => "rgba8unorm",
    },
  });
  const canvas = document.createElement("canvas");
  const unconfigure = vi.fn();
  vi.spyOn(canvas, "getContext").mockReturnValue({
    configure: vi.fn(),
    unconfigure,
  } as unknown as GPUCanvasContext);
  const surface = acquireWebGpuSurface(canvas);
  try {
    await surface.ready;
    const previous = surface.main;
    surface.createTarget(10, 10);
    const oldTextures = textures.slice();
    listeners[0]({ error: { message: "transient out of memory" } });
    expect(surface.available).toBe(false);
    expect(requestDevice).toHaveBeenCalledTimes(1);
    expect(surface.recover()).toBe(false);
    await surface.ready;
    expect(surface.available).toBe(true);
    expect(surface.error).toBeUndefined();
    expect(surface.main).not.toBe(previous);
    expect(devices[0].destroy).toHaveBeenCalledTimes(1);
    oldTextures.forEach((texture) =>
      expect(texture.destroy).toHaveBeenCalledTimes(1),
    );
    expect(unconfigure).toHaveBeenCalledTimes(1);
    listeners[0]({ error: { message: "late error from retired device" } });
    expect(surface.available).toBe(true);
    expect(requestDevice).toHaveBeenCalledTimes(2);
  } finally {
    surface.release();
    vi.unstubAllGlobals();
  }
});

it("invalidates staged upload metadata when submission throws synchronously", async () => {
  vi.stubGlobal("GPUTextureUsage", {
    RENDER_ATTACHMENT: 16,
    COPY_DST: 2,
    COPY_SRC: 1,
    TEXTURE_BINDING: 4,
  });
  const command = {
    beginRenderPass: vi.fn(() => ({ end: vi.fn() })),
    copyTextureToTexture: vi.fn(),
    finish: vi.fn(() => ({})),
  };
  const device = {
    destroy: vi.fn(),
    addEventListener: vi.fn(),
    lost: new Promise(() => {}),
    limits: { maxTextureDimension2D: 8192 },
    createTexture: vi.fn(() => ({
      destroy: vi.fn(),
      createView: vi.fn(() => ({})),
    })),
    createCommandEncoder: vi.fn(() => command),
    queue: {
      submit: vi.fn(() => {
        throw new Error("submission failed");
      }),
    },
  };
  vi.stubGlobal("navigator", {
    gpu: {
      requestAdapter: vi.fn(async () => ({
        requestDevice: async () => device,
      })),
      getPreferredCanvasFormat: () => "rgba8unorm",
    },
  });
  const canvas = document.createElement("canvas");
  vi.spyOn(canvas, "getContext").mockReturnValue({
    configure: vi.fn(),
    unconfigure: vi.fn(),
    getCurrentTexture: vi.fn(() => ({})),
  } as unknown as GPUCanvasContext);
  const surface = acquireWebGpuSurface(canvas);
  try {
    await surface.ready;
    const revision = surface.abortRevision;
    const cleanup = vi.fn();
    surface.beginFrame(100, 100);
    surface.defer(cleanup);
    expect(() => surface.endFrame()).toThrow("submission failed");
    expect(surface.abortRevision).toBe(revision + 1);
    expect(surface.frameActive).toBe(false);
    expect(cleanup).toHaveBeenCalledTimes(1);
    surface.abortFrame();
    expect(surface.abortRevision).toBe(revision + 1);
  } finally {
    surface.release();
    vi.unstubAllGlobals();
  }
});
