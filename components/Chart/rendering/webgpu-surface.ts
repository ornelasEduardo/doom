/// <reference types="@webgpu/types" preserve="true" />

export interface GpuTarget {
  texture: GPUTexture;
  color: GPUTexture;
  depth: GPUTexture;
  width: number;
  height: number;
}

const surfaces = new WeakMap<HTMLCanvasElement, WebGpuSurface>();

/** One device and submission boundary shared by a chart's renderers. */
function createSurface(canvas: HTMLCanvasElement, sampleCount: 1 | 4) {
  let refs = 0;
  let disposed = false;
  let device: GPUDevice | undefined;
  let context: GPUCanvasContext | null = null;
  let format: GPUTextureFormat = "bgra8unorm";
  let main: GpuTarget | undefined;
  let error: string | undefined;
  let pending: Promise<void> | undefined;
  let encoder: GPUCommandEncoder | undefined;
  const deferred: (() => void)[] = [];
  const listeners = new Set<() => void>();
  const targets = new Set<GpuTarget>();
  let generation = 0;
  let abortRevision = 0;
  const notify = () => listeners.forEach((listener) => listener());
  const cleanup = () => deferred.splice(0).forEach((release) => release());
  function destroyTarget(target: GpuTarget) {
    target.texture.destroy();
    target.color.destroy();
    target.depth.destroy();
    targets.delete(target);
  }
  function createTarget(width: number, height: number): GpuTarget {
    const gpu = surface.device;
    if (
      !Number.isInteger(width) ||
      !Number.isInteger(height) ||
      width < 1 ||
      height < 1 ||
      width > gpu.limits.maxTextureDimension2D ||
      height > gpu.limits.maxTextureDimension2D
    ) {
      throw new RangeError("WebGPU target dimensions exceed device limits");
    }
    const allocated: GPUTexture[] = [];
    const texture = (descriptor: GPUTextureDescriptor) => {
      const result = gpu.createTexture(descriptor);
      allocated.push(result);
      return result;
    };
    try {
      const target = {
        texture: texture({
          size: [width, height],
          format,
          usage:
            GPUTextureUsage.RENDER_ATTACHMENT |
            GPUTextureUsage.TEXTURE_BINDING |
            GPUTextureUsage.COPY_SRC,
        }),
        color: texture({
          size: [width, height],
          format,
          sampleCount,
          usage: GPUTextureUsage.RENDER_ATTACHMENT,
        }),
        depth: texture({
          size: [width, height],
          format: "depth24plus-stencil8",
          sampleCount,
          usage: GPUTextureUsage.RENDER_ATTACHMENT,
        }),
        width,
        height,
      };
      targets.add(target);
      return target;
    } catch (cause) {
      allocated.forEach((item) => item.destroy());
      throw cause;
    }
  }
  function initialize(): Promise<void> {
    if (pending) {
      return pending;
    }
    const version = ++generation;
    pending = (async () => {
      try {
        if (!globalThis.navigator?.gpu) {
          throw new Error("WebGPU is unavailable in this browser");
        }
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
          throw new Error("WebGPU adapter is unavailable");
        }
        const next = await adapter.requestDevice();
        if (disposed || version !== generation) {
          next.destroy();
          return;
        }
        context = canvas.getContext("webgpu");
        if (!context) {
          next.destroy();
          throw new Error("WebGPU canvas is unavailable");
        }
        device = next;
        format = navigator.gpu.getPreferredCanvasFormat();
        context.configure({
          device: next,
          format,
          alphaMode: "premultiplied",
          usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_DST,
        });
        error = undefined;
        next.addEventListener("uncapturederror", (event) => {
          if (device !== next || disposed) {
            return;
          }
          error = event.error.message;
          notify();
        });
        void next.lost.then((info) => {
          if (disposed || device !== next) {
            return;
          }
          device = undefined;
          main = undefined;
          targets.clear();
          encoder = undefined;
          cleanup();
          error = `WebGPU device lost: ${info.message || info.reason}`;
          notify();
        });
      } catch (cause) {
        // A released canvas may already belong to a new surface. Late failures
        // from this initialization must not unconfigure its replacement.
        if (disposed || version !== generation) {
          return;
        }
        context?.unconfigure();
        device?.destroy();
        device = undefined;
        if (!disposed) {
          error = cause instanceof Error ? cause.message : String(cause);
        }
      }
    })().finally(() => {
      pending = undefined;
      if (!disposed) {
        notify();
      }
    });
    return pending;
  }
  function resize(width: number, height: number) {
    if (main?.width === width && main.height === height) {
      return;
    }
    if (encoder) {
      throw new Error("Cannot resize WebGPU surface during a frame");
    }
    const next = createTarget(width, height);
    if (main) {
      destroyTarget(main);
    }
    main = next;
    if (canvas.width !== width) {
      canvas.width = width;
    }
    if (canvas.height !== height) {
      canvas.height = height;
    }
  }
  function resolve(target: GpuTarget | null = null, command = encoder) {
    if (sampleCount === 1) {
      return;
    }
    if (!command) {
      surface.run((next) => resolve(target, next));
      return;
    }
    const layer = target ?? surface.main;
    command
      .beginRenderPass({
        colorAttachments: [
          {
            view: layer.color.createView(),
            resolveTarget: layer.texture.createView(),
            loadOp: "load",
            storeOp: "store",
          },
        ],
      })
      .end();
  }
  function submit() {
    const command = encoder;
    encoder = undefined;
    try {
      if (command && main && context && device) {
        resolve(main, command);
        command.copyTextureToTexture(
          { texture: main.texture },
          { texture: context.getCurrentTexture() },
          [main.width, main.height],
        );
        device.queue.submit([command.finish()]);
      }
    } catch (cause) {
      if (command) {
        abortRevision++;
      }
      throw cause;
    } finally {
      cleanup();
    }
  }
  const surface = {
    get ready() {
      return pending ?? Promise.resolve();
    },
    get available() {
      return !disposed && !!device && !error;
    },
    get error() {
      return error;
    },
    get device() {
      if (!device) {
        throw new Error(error ?? "WebGPU device is not ready");
      }
      return device;
    },
    get format() {
      return format;
    },
    get sampleCount() {
      return sampleCount;
    },
    get abortRevision() {
      return abortRevision;
    },
    get frameActive() {
      return !!encoder;
    },
    get main() {
      if (!main) {
        resize(Math.max(1, canvas.width), Math.max(1, canvas.height));
      }
      return main!;
    },
    retain() {
      refs++;
    },
    subscribe(callback: () => void) {
      listeners.add(callback);
      return () => {
        listeners.delete(callback);
      };
    },
    recover() {
      if (disposed) {
        return false;
      }
      if (error && device && !pending) {
        // Uncaptured errors can leave a live device unusable. Explicit retries
        // retire every handle before requesting a replacement device.
        const retired = device;
        device = undefined;
        surface.abortFrame();
        targets.forEach(destroyTarget);
        main = undefined;
        context?.unconfigure();
        retired.destroy();
      }
      if (!device && !pending) {
        void initialize();
      }
      return surface.available;
    },
    resize,
    resolve,
    createTarget,
    destroyTarget,
    beginFrame(width: number, height: number) {
      resize(width, height);
      if (encoder) {
        throw new Error("WebGPU frame already open");
      }
      encoder = surface.device.createCommandEncoder();
    },
    endFrame: submit,
    abortFrame() {
      if (encoder) {
        abortRevision++;
      }
      encoder = undefined;
      cleanup();
    },
    run(record: (encoder: GPUCommandEncoder) => void) {
      const standalone = !encoder;
      if (standalone) {
        resize(Math.max(1, canvas.width), Math.max(1, canvas.height));
      }
      encoder ??= surface.device.createCommandEncoder();
      try {
        record(encoder);
        if (standalone) {
          submit();
        }
      } catch (cause) {
        surface.abortFrame();
        throw cause;
      }
    },
    defer(release: () => void) {
      if (encoder) {
        deferred.push(release);
      } else {
        release();
      }
    },
    /** Queue writes precede an entire submission; staging copies preserve draw order inside a frame. */
    writeBuffer(
      buffer: GPUBuffer,
      offset: number,
      data: ArrayBufferView<ArrayBufferLike>,
    ) {
      const bytes = new Uint8Array(
        data.buffer,
        data.byteOffset,
        data.byteLength,
      );
      if (!encoder) {
        surface.device.queue.writeBuffer(
          buffer,
          offset,
          bytes.buffer as ArrayBuffer,
          bytes.byteOffset,
          bytes.byteLength,
        );
        return;
      }
      if (!bytes.byteLength) {
        return;
      }
      const staging = surface.device.createBuffer({
        size: bytes.byteLength,
        usage: GPUBufferUsage.COPY_SRC,
        mappedAtCreation: true,
      });
      new Uint8Array(staging.getMappedRange()).set(bytes);
      staging.unmap();
      encoder.copyBufferToBuffer(staging, 0, buffer, offset, bytes.byteLength);
      deferred.push(() => staging.destroy());
    },
    passDescriptor(
      target: GpuTarget | null | undefined,
      options: { clear?: boolean; stencilClear?: boolean } = {},
    ): GPURenderPassDescriptor {
      const layer = target ?? surface.main;
      return {
        colorAttachments: [
          {
            view: (sampleCount === 1
              ? layer.texture
              : layer.color
            ).createView(),

            loadOp: options.clear ? "clear" : "load",
            storeOp: "store",
            clearValue: { r: 0, g: 0, b: 0, a: 0 },
          },
        ],
        depthStencilAttachment: {
          view: layer.depth.createView(),
          depthLoadOp: options.clear ? "clear" : "load",
          depthStoreOp: "store",
          depthClearValue: 1,
          stencilLoadOp:
            options.clear || options.stencilClear ? "clear" : "load",
          stencilStoreOp: "store",
          stencilClearValue: 0,
        },
      };
    },
    release() {
      if (disposed || --refs > 0) {
        return;
      }
      disposed = true;
      generation++;
      surface.abortFrame();
      targets.forEach(destroyTarget);
      main = undefined;
      context?.unconfigure();
      device?.destroy();
      device = undefined;
      listeners.clear();
      surfaces.delete(canvas);
    },
  };
  void initialize();
  return surface;
}

export type WebGpuSurface = ReturnType<typeof createSurface>;

export function acquireWebGpuSurface(
  canvas: HTMLCanvasElement,
  options: { sampleCount?: 1 | 4 } = {},
): WebGpuSurface {
  let surface = surfaces.get(canvas);
  if (!surface) {
    surface = createSurface(canvas, options.sampleCount ?? 4);
    surfaces.set(canvas, surface);
  }
  surface.retain();
  return surface;
}
