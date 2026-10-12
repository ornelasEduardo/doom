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
  const gl = canvas.getContext("webgl2", {
    antialias: false,
    depth: false,
    stencil: false,
  });
  if (!gl) {
    throw new Error("WebGL2 unavailable");
  }
  let program: WebGLProgram | null = null;
  let buffer: WebGLBuffer | null = null;
  let fence: WebGLSync | null = null;
  const shaders: WebGLShader[] = [];
  let disposed = false;
  const dispose = () => {
    if (disposed) {
      return;
    }
    disposed = true;
    if (fence) {
      gl.deleteSync(fence);
    }
    if (buffer) {
      gl.deleteBuffer(buffer);
    }
    if (program) {
      gl.deleteProgram(program);
    }
    shaders.forEach((shader) => gl.deleteShader(shader));
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  };
  try {
    program = gl.createProgram();
    if (!program) {
      throw new Error("GPU program allocation failed");
    }
    for (const [type, source] of [
      [
        gl.VERTEX_SHADER,
        `#version 300 es
      in vec2 point;
      void main() { gl_Position=vec4(point*2.0-1.0,0,1); gl_PointSize=1.0; }`,
      ],
      [
        gl.FRAGMENT_SHADER,
        `#version 300 es
      precision mediump float;
      out vec4 color;
      void main() { color=vec4(0.63,0.29,0.98,1); }`,
      ],
    ] as const) {
      const shader = gl.createShader(type);
      if (!shader) {
        throw new Error("GPU shader allocation failed");
      }
      shaders.push(shader);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        throw new Error(
          gl.getShaderInfoLog(shader) || "Shader compilation failed",
        );
      }
      gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) || "Shader link failed");
    }
    gl.useProgram(program);
    const initialized = performance.now();
    buffer = gl.createBuffer();
    if (!buffer) {
      throw new Error("GPU buffer allocation failed");
    }
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array(grid.coordinates),
      gl.STATIC_DRAW,
    );
    const location = gl.getAttribLocation(program, "point");
    if (location < 0) {
      throw new Error("GPU point attribute unavailable");
    }
    gl.enableVertexAttribArray(location);
    gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.POINTS, 0, count);
    const submitted = performance.now();
    if (gl.getError() !== gl.NO_ERROR) {
      throw new Error("GPU submission failed");
    }
    fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    if (!fence) {
      throw new Error("GPU fence unavailable");
    }
    gl.flush();
    await new Promise<void>((resolve, reject) => {
      let frame = 0;
      let settled = false;
      const finish = (error?: unknown) => {
        if (settled) {
          return;
        }
        settled = true;
        clearTimeout(timer);
        cancelAnimationFrame(frame);
        signal?.removeEventListener("abort", abort);
        canvas.removeEventListener("webglcontextlost", lost);
        if (error !== undefined) {
          reject(error);
        } else {
          resolve();
        }
      };
      const abort = () =>
        finish(signal?.reason ?? new DOMException("Aborted", "AbortError"));
      const lost = () => finish(new Error("GPU context lost"));
      const timer = setTimeout(
        () => finish(new Error("GPU completion timed out")),
        timeoutMs,
      );
      const poll = () => {
        try {
          const status = gl.clientWaitSync(fence!, 0, 0);
          if (gl.isContextLost() || status === gl.WAIT_FAILED) {
            finish(new Error("GPU completion failed"));
          } else if (status === gl.TIMEOUT_EXPIRED) {
            frame = requestAnimationFrame(poll);
          } else if (
            status === gl.ALREADY_SIGNALED ||
            status === gl.CONDITION_SATISFIED
          ) {
            finish();
          } else {
            finish(new Error("Unexpected GPU completion status"));
          }
        } catch (error) {
          finish(error);
        }
      };
      signal?.addEventListener("abort", abort, { once: true });
      canvas.addEventListener("webglcontextlost", lost, { once: true });
      if (signal?.aborted) {
        abort();
      } else {
        frame = requestAnimationFrame(poll);
      }
    });
    gl.deleteSync(fence);
    fence = null;
    const completed = performance.now();
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    return {
      timings: {
        preparationMs: prepared - start,
        initializationMs: initialized - prepared,
        uploadAndSubmitMs: submitted - initialized,
        gpuCompletionAtFrameMs: completed - start,
      },
      backend: info
        ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL))
        : "Unavailable",
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
  }
}
