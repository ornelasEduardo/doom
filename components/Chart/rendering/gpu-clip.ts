import { type ClipPolygon, counterclockwise } from "./clip-geometry";

export type { ClipPolygon } from "./clip-geometry";

/** Shared fragment clipping in canvas CSS coordinates, independent of mark transforms. */
export const gpuClipFragment = `
uniform highp sampler2D gpuClipEdges;
uniform int gpuClipCount;
uniform int gpuClipTextureWidth;
uniform highp vec4 gpuClipViewport;
bool outsideGpuClip() {
  highp vec2 p = vec2(gl_FragCoord.x, gpuClipViewport.w - gl_FragCoord.y)
    * gpuClipViewport.xy / gpuClipViewport.zw;
  for (int i = 0; i < gpuClipCount; i++) {
    highp vec3 edge = texelFetch(gpuClipEdges, ivec2(i % gpuClipTextureWidth, i / gpuClipTextureWidth), 0).xyz;
    if (dot(edge.xy, p) + edge.z < -0.00001) return true;
  }
  return gpuClipCount < 0;
}`;

/** Own one small edge texture per renderer; ordinary rectangular clips upload no edges. */
export function createGpuClip(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
) {
  const uniforms = Object.fromEntries(
    [
      "gpuClipEdges",
      "gpuClipCount",
      "gpuClipTextureWidth",
      "gpuClipViewport",
    ].map((name) => {
      const location = gl.getUniformLocation(program, name);
      if (location === null) {
        throw new Error(`GPU clip uniform ${name} unavailable`);
      }
      return [name, location];
    }),
  );
  let texture: WebGLTexture | null = null;
  let retained: ClipPolygon | undefined;
  let textureWidth = 1;
  let uploaded = false;
  let edgeCount = 0;
  return {
    set(
      polygon: ClipPolygon | undefined,
      width: number,
      height: number,
      pixelWidth: number,
      pixelHeight: number,
    ) {
      if (
        polygon?.some(
          (point) =>
            !Number.isFinite(point.x) ||
            !Number.isFinite(point.y) ||
            Math.abs(point.x) > 1e30 ||
            Math.abs(point.y) > 1e30,
        )
      ) {
        throw new RangeError(
          "GPU clip coordinates must be finite and representable",
        );
      }
      const fresh = texture === null;
      if (fresh) {
        texture = gl.createTexture();
        if (!texture) {
          throw new Error("GPU clip texture allocation failed");
        }
      }
      gl.activeTexture(gl.TEXTURE1);
      try {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        const unchanged =
          polygon === undefined
            ? retained === undefined
            : retained?.length === polygon.length &&
              polygon.every(
                (point, i) =>
                  point.x === retained![i].x && point.y === retained![i].y,
              );
        if (!uploaded || !unchanged) {
          const points = polygon ? counterclockwise(polygon) : [];
          const count = points.length;
          const max = gl.getParameter(gl.MAX_TEXTURE_SIZE) as number;
          textureWidth = Math.min(max, Math.max(1, count));
          const rows = Math.max(1, Math.ceil(count / textureWidth));
          if (rows > max) {
            throw new RangeError("GPU clip exceeds texture capacity");
          }
          const data = new Float32Array(textureWidth * rows * 4);
          points.forEach((point, i) => {
            const next = points[(i + 1) % count];
            const dx = next.x - point.x,
              dy = next.y - point.y;
            const length = Math.hypot(dx, dy) || 1;
            data[i * 4] = -dy / length;
            data[i * 4 + 1] = dx / length;
            data[i * 4 + 2] = (dy * point.x - dx * point.y) / length;
          });
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
          gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA32F,
            textureWidth,
            rows,
            0,
            gl.RGBA,
            gl.FLOAT,
            data,
          );
          edgeCount = count;
          retained = polygon?.map((point) => ({ ...point }));
          uploaded = true;
        }
        gl.uniform1i(uniforms.gpuClipEdges, 1);
        gl.uniform1i(
          uniforms.gpuClipCount,
          polygon ? (edgeCount < 3 ? -1 : edgeCount) : 0,
        );
        gl.uniform1i(uniforms.gpuClipTextureWidth, textureWidth);
        gl.uniform4f(
          uniforms.gpuClipViewport,
          width,
          height,
          pixelWidth,
          pixelHeight,
        );
      } finally {
        gl.activeTexture(gl.TEXTURE0);
      }
    },
    dispose() {
      if (texture) {
        gl.deleteTexture(texture);
      }
      texture = null;
      retained = undefined;
      uploaded = false;
    },
  };
}
