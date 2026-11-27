/** Same-context premultiplied layers, allocated only for opacity isolation. */
export function createGpuCompositor(gl: WebGL2RenderingContext) {
  type Layer = {
    framebuffer: WebGLFramebuffer;
    texture: WebGLTexture;
    resolved: WebGLFramebuffer;
    color: WebGLRenderbuffer;
    stencil: WebGLRenderbuffer;
    width: number;
    height: number;
  };
  const layers: Layer[] = [];
  let program: WebGLProgram | undefined;
  let vao: WebGLVertexArrayObject | undefined;
  let opacity: WebGLUniformLocation | null = null;
  let samples: number | undefined;
  let used = 0;
  let width = 0,
    height = 0;
  const reset = () => {
    layers.length = 0;
    program = undefined;
    vao = undefined;
    samples = undefined;
  };
  gl.canvas.addEventListener("webglcontextlost", reset);
  function setup() {
    if (program) {
      return;
    }
    const p = gl.createProgram();
    if (!p) {
      throw new Error("GPU compositor program allocation failed");
    }
    const shaders: WebGLShader[] = [];
    try {
      for (const [type, source] of [
        [
          gl.VERTEX_SHADER,
          `#version 300 es
        out vec2 uv;
        void main(){ vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2)); uv=p; gl_Position=vec4(p*2.0-1.0,0,1); }`,
        ],
        [
          gl.FRAGMENT_SHADER,
          `#version 300 es
        precision highp float; in vec2 uv; uniform sampler2D image; uniform float opacity; out vec4 color;
        void main(){color=texture(image,uv)*opacity;}`,
        ],
      ] as const) {
        const shader = gl.createShader(type);
        if (!shader) {
          throw new Error("GPU compositor shader allocation failed");
        }
        shaders.push(shader);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        gl.attachShader(p, shader);
      }
      gl.linkProgram(p);
      if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
        throw new Error(
          gl.getProgramInfoLog(p) || "GPU compositor linking failed",
        );
      }
      vao = gl.createVertexArray() ?? undefined;
      if (!vao) {
        throw new Error("GPU compositor vertex array allocation failed");
      }
      opacity = gl.getUniformLocation(p, "opacity");
      if (opacity === null) {
        throw new Error("GPU compositor opacity unavailable");
      }
      program = p;
    } catch (error) {
      gl.deleteProgram(p);
      if (vao) {
        gl.deleteVertexArray(vao);
      }
      vao = undefined;
      throw error;
    } finally {
      shaders.forEach((s) => gl.deleteShader(s));
    }
  }
  function release(layer: Layer) {
    gl.deleteFramebuffer(layer.framebuffer);
    gl.deleteFramebuffer(layer.resolved);
    gl.deleteRenderbuffer(layer.color);
    gl.deleteTexture(layer.texture);
    gl.deleteRenderbuffer(layer.stencil);
  }
  return {
    begin(w: number, h: number) {
      if (w !== width || h !== height) {
        layers.forEach(release);
        layers.length = 0;
      }
      used = 0;
      width = w;
      height = h;
    },
    open(depth: number) {
      setup();
      used = Math.max(used, depth + 1);
      let layer = layers[depth];
      if (!layer) {
        const framebuffer = gl.createFramebuffer(),
          resolved = gl.createFramebuffer(),
          color = gl.createRenderbuffer(),
          texture = gl.createTexture(),
          stencil = gl.createRenderbuffer();
        if (!framebuffer || !resolved || !color || !texture || !stencil) {
          gl.deleteFramebuffer(framebuffer);
          gl.deleteFramebuffer(resolved);
          gl.deleteRenderbuffer(color);
          gl.deleteTexture(texture);
          gl.deleteRenderbuffer(stencil);
          throw new Error("GPU opacity layer allocation failed");
        }
        layer = {
          framebuffer,
          resolved,
          color,
          texture,
          stencil,
          width,
          height,
        };
        try {
          gl.bindTexture(gl.TEXTURE_2D, texture);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA8,
            width,
            height,
            0,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            null,
          );
          gl.bindFramebuffer(gl.FRAMEBUFFER, resolved);
          gl.framebufferTexture2D(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.TEXTURE_2D,
            texture,
            0,
          );
          if (
            gl.checkFramebufferStatus(gl.FRAMEBUFFER) !==
            gl.FRAMEBUFFER_COMPLETE
          ) {
            throw new Error("GPU opacity resolve framebuffer unavailable");
          }
          // Keep vector edges antialiased when group isolation redirects them
          // away from the antialiased default framebuffer.
          samples ??= Math.max(
            0,
            ...Array.from(
              gl.getInternalformatParameter(
                gl.RENDERBUFFER,
                gl.RGBA8,
                gl.SAMPLES,
              ) as Int32Array,
            ).filter(
              (count) =>
                count <= 4 &&
                Array.from(
                  gl.getInternalformatParameter(
                    gl.RENDERBUFFER,
                    gl.STENCIL_INDEX8,
                    gl.SAMPLES,
                  ) as Int32Array,
                ).includes(count),
            ),
          );
          gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
          gl.bindRenderbuffer(gl.RENDERBUFFER, color);
          gl.renderbufferStorageMultisample(
            gl.RENDERBUFFER,
            samples,
            gl.RGBA8,
            width,
            height,
          );
          gl.framebufferRenderbuffer(
            gl.FRAMEBUFFER,
            gl.COLOR_ATTACHMENT0,
            gl.RENDERBUFFER,
            color,
          );
          gl.bindRenderbuffer(gl.RENDERBUFFER, stencil);
          gl.renderbufferStorageMultisample(
            gl.RENDERBUFFER,
            samples,
            gl.STENCIL_INDEX8,
            width,
            height,
          );
          gl.framebufferRenderbuffer(
            gl.FRAMEBUFFER,
            gl.STENCIL_ATTACHMENT,
            gl.RENDERBUFFER,
            stencil,
          );
          if (
            gl.checkFramebufferStatus(gl.FRAMEBUFFER) !==
            gl.FRAMEBUFFER_COMPLETE
          ) {
            throw new Error("GPU opacity framebuffer unavailable");
          }
        } catch (error) {
          release(layer);
          throw error;
        }
        layers[depth] = layer;
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, layer.framebuffer);
      gl.disable(gl.SCISSOR_TEST);
      gl.colorMask(true, true, true, true);
      gl.stencilMask(0xff);
      gl.clearColor(0, 0, 0, 0);
      gl.clearStencil(0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
      return layer.framebuffer;
    },
    close(depth: number, alpha: number, target: WebGLFramebuffer | null) {
      gl.disable(gl.SCISSOR_TEST);
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, layers[depth].framebuffer);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, layers[depth].resolved);
      gl.blitFramebuffer(
        0,
        0,
        width,
        height,
        0,
        0,
        width,
        height,
        gl.COLOR_BUFFER_BIT,
        gl.NEAREST,
      );
      gl.bindFramebuffer(gl.FRAMEBUFFER, target);
      gl.viewport(0, 0, width, height);
      gl.disable(gl.SCISSOR_TEST);
      gl.disable(gl.STENCIL_TEST);
      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.CULL_FACE);
      gl.colorMask(true, true, true, true);
      gl.enable(gl.BLEND);
      gl.blendEquation(gl.FUNC_ADD);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(program!);
      gl.bindVertexArray(vao!);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, layers[depth].texture);
      gl.uniform1i(gl.getUniformLocation(program!, "image"), 0);
      gl.uniform1f(opacity, alpha);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
      gl.bindTexture(gl.TEXTURE_2D, null);
    },
    end() {
      layers.splice(used).forEach(release);
    },
    dispose() {
      gl.canvas.removeEventListener("webglcontextlost", reset);
      layers.forEach(release);
      if (program) {
        gl.deleteProgram(program);
      }
      if (vao) {
        gl.deleteVertexArray(vao);
      }
      reset();
    },
  };
}
