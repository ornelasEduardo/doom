import { createGpuPoints, type GpuPointSource } from "./gpu";
import { readGpuEmphasis, subscribeGpuEffects } from "./gpu-effects";
import { createGpuVector, type VectorShape } from "./gpu-vector";
import styles from "./scene.module.scss";
import type { VectorContour } from "./vector-path";

export type GpuMark =
  | {
      kind: "path";
      contours: readonly VectorContour[];
      strokeOpacity?: number;
      gradient?: { startOpacity: number; endOpacity: number };
    }
  | { kind: "point"; x: number; y: number; radius: number }
  | {
      kind: "cloud";
      seriesId: string;
      dataIndices: Int32Array;
      dataAt?: (slot: number) => unknown;
      positions: Float32Array;
      radii: Float32Array;
      radius: number;
    };

type Rect = { x: number; y: number; width: number; height: number };
const scenes = new WeakMap<SVGSVGElement, ReturnType<typeof createScene>>();

function createScene(svg: SVGSVGElement) {
  const canvas = document.createElement("canvas");
  canvas.className = styles.canvas;
  canvas.setAttribute("aria-hidden", "true");
  canvas.dataset.chartGpu = "preparing";
  svg.parentElement?.insertBefore(canvas, svg);
  const marks = new Map<SVGGraphicsElement, GpuMark>();
  const pointSources = new WeakMap<
    GpuMark,
    { scale: number; source: GpuPointSource }
  >();
  const colors = document.createElement("canvas").getContext("2d");
  let vector: ReturnType<typeof createGpuVector> | undefined;
  let points: ReturnType<typeof createGpuPoints> | undefined;
  let frame = 0;
  let disposed = false;
  let status: HTMLDivElement | undefined;
  const unavailable = () => {
    canvas.dataset.chartGpu = "unavailable";
    if (!status) {
      status = document.createElement("div");
      status.className = styles.status;
      status.setAttribute("role", "status");
      status.textContent =
        "GPU rendering is unavailable. Chart data remains accessible with the keyboard.";
      svg.parentElement?.append(status);
    }
  };
  function color(value: string, opacity: number) {
    if (!colors || value === "none") {
      return undefined;
    }
    colors.clearRect(0, 0, 1, 1);
    colors.fillStyle = value;
    colors.fillRect(0, 0, 1, 1);
    const rgba = Array.from(
      colors.getImageData(0, 0, 1, 1).data,
      (v) => v / 255,
    );
    rgba[3] *= opacity;
    return rgba;
  }
  const schedule = () => {
    if (!disposed && !frame) {
      frame = requestAnimationFrame(draw);
    }
  };
  function matrixFor(node: SVGGraphicsElement) {
    const root = svg.getScreenCTM();
    const local = node.getScreenCTM();
    return root && local ? root.inverse().multiply(local) : null;
  }
  function clipFor(node: SVGGraphicsElement): Rect | undefined {
    let clip: Rect | undefined;
    for (
      let element: Element | null = node;
      element && element !== svg;
      element = element.parentElement
    ) {
      const url = getComputedStyle(element).clipPath;
      const id = /#([^"')]+)/.exec(url)?.[1];
      const rect =
        id && svg.ownerDocument.getElementById(id)?.querySelector("rect");
      if (!rect || !(element instanceof SVGGraphicsElement)) {
        continue;
      }
      const m = matrixFor(element);
      if (!m) {
        continue;
      }
      const p = new DOMPoint(
        rect.x.baseVal.value,
        rect.y.baseVal.value,
      ).matrixTransform(m);
      const q = new DOMPoint(
        rect.x.baseVal.value + rect.width.baseVal.value,
        rect.y.baseVal.value + rect.height.baseVal.value,
      ).matrixTransform(m);
      const next = {
        x: Math.min(p.x, q.x),
        y: Math.min(p.y, q.y),
        width: Math.abs(q.x - p.x),
        height: Math.abs(q.y - p.y),
      };
      if (!clip) {
        clip = next;
      } else {
        const x = Math.max(clip.x, next.x),
          y = Math.max(clip.y, next.y);
        clip = {
          x,
          y,
          width: Math.max(
            0,
            Math.min(clip.x + clip.width, next.x + next.width) - x,
          ),
          height: Math.max(
            0,
            Math.min(clip.y + clip.height, next.y + next.height) - y,
          ),
        };
      }
    }
    return clip;
  }
  function draw() {
    frame = 0;
    if (disposed || !svg.isConnected) {
      return;
    }
    const width = svg.width.baseVal.value,
      height = svg.height.baseVal.value;
    if (!(width > 0 && height > 0)) {
      return;
    }
    const ratio = window.devicePixelRatio || 1;
    const w = Math.round(width * ratio),
      h = Math.round(height * ratio);
    if (canvas.width !== w) {
      canvas.width = w;
    }
    if (canvas.height !== h) {
      canvas.height = h;
    }
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    try {
      vector ??= createGpuVector(canvas);
      points ??= createGpuPoints(canvas, { onStatusChange: schedule });
      if (!vector.available) {
        vector.recover();
      }
      if (!points.available) {
        points.recover();
      }
      if (!vector.available || !points.available) {
        unavailable();
        return;
      }
      vector.draw([], { width, height, ratio });
      const ordered = [...marks].sort(([a], [b]) =>
        a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING
          ? -1
          : 1,
      );
      type Batch = {
        key: string;
        positions: number[];
        radii: number[];
        fill: number[];
        stroke?: { color: number[]; width: number };
        clip?: Rect;
      };
      let batch: Batch | undefined;
      const flush = () => {
        if (!batch) {
          return;
        }
        const positions = new Float32Array(batch.positions);
        const radii = new Float32Array(batch.radii);
        points!.draw(
          { length: radii.length, buffers: () => ({ positions, radii }) },
          {
            width,
            height,
            ratio,
            plotWidth: width,
            plotHeight: height,
            k: 1,
            x: 0,
            y: 0,
            matrix: new DOMMatrix(),
            axes: {
              x: { type: "linear", domain: [0, width] },
              y: { type: "linear", domain: [0, height] },
            },
            color: batch.fill,
            stroke: batch.stroke,
            radius: 6,
            clip: batch.clip,
            clear: false,
          },
        );
        batch = undefined;
      };
      for (const [node, mark] of ordered) {
        const css = getComputedStyle(node),
          matrix = matrixFor(node);
        if (!matrix || css.display === "none" || css.visibility === "hidden") {
          continue;
        }
        let opacity = 1;
        for (
          let ancestor: Element | null = node;
          ancestor;
          ancestor = ancestor.parentElement
        ) {
          const ancestorStyle = getComputedStyle(ancestor);
          if (ancestorStyle.display === "none") {
            opacity = 0;
            break;
          }
          opacity *= Number(ancestorStyle.opacity);
          if (ancestor === svg) {
            break;
          }
        }
        if (opacity === 0) {
          continue;
        }
        const fill = color(css.fill, opacity),
          strokeColor = color(
            css.stroke,
            opacity * (mark.kind === "path" ? (mark.strokeOpacity ?? 1) : 1),
          );
        const strokeWidth =
          Number.parseFloat(css.strokeWidth) *
          Math.sqrt(Math.abs(matrix.a * matrix.d - matrix.b * matrix.c));
        const stroke =
          strokeColor && strokeWidth > 0
            ? { color: strokeColor, width: strokeWidth }
            : undefined;
        const clip = clipFor(node);
        if (mark.kind === "point") {
          const key = JSON.stringify([fill, stroke, clip]);
          if (batch?.key !== key) {
            flush();
            batch = {
              key,
              positions: [],
              radii: [],
              fill: fill ?? [0, 0, 0, 0],
              stroke,
              clip,
            };
          }
          const p = new DOMPoint(mark.x, mark.y).matrixTransform(matrix);
          batch!.positions.push(p.x, p.y);
          batch!.radii.push(
            mark.radius *
              Math.sqrt(Math.abs(matrix.a * matrix.d - matrix.b * matrix.c)),
          );
          continue;
        }
        flush();
        if (mark.kind === "path") {
          const contours = mark.contours.map((contour) => ({
            ...contour,
            points: contour.points.map((p) =>
              new DOMPoint(p.x, p.y).matrixTransform(matrix),
            ),
          }));
          let y0 = Infinity,
            y1 = -Infinity;
          for (const contour of contours) {
            for (const p of contour.points) {
              y0 = Math.min(y0, p.y);
              y1 = Math.max(y1, p.y);
            }
          }
          const shape: VectorShape = {
            contours,
            fill: fill
              ? {
                  color: fill,
                  gradient: mark.gradient
                    ? {
                        ...mark.gradient,
                        y0: y0 + (y1 - y0) * 0.05,
                        y1: y1 - (y1 - y0) * 0.05,
                      }
                    : undefined,
                }
              : undefined,
            stroke,
          };
          vector.draw([shape], { width, height, ratio, clip, clear: false });
        } else {
          const positions = mark.positions;
          const scale = Math.sqrt(
            Math.abs(matrix.a * matrix.d - matrix.b * matrix.c),
          );
          let cached = pointSources.get(mark);
          if (!cached || cached.scale !== scale) {
            const radii =
              scale === 1
                ? mark.radii
                : Float32Array.from(mark.radii, (radius) => radius * scale);
            cached = {
              scale,
              source: {
                immutable: true,
                length: positions.length / 2,
                buffers: () => ({ positions, radii }),
              },
            };
            pointSources.set(mark, cached);
          }
          const source = cached.source;
          points.draw(source, {
            width,
            height,
            plotWidth: width,
            plotHeight: height,
            k: 1,
            x: 0,
            y: 0,
            matrix,
            axes: {
              x: { type: "linear", domain: [0, width] },
              y: { type: "linear", domain: [0, height] },
            },
            ratio,
            radius:
              mark.radius *
              Math.sqrt(Math.abs(matrix.a * matrix.d - matrix.b * matrix.c)),
            color: fill ?? [0, 0, 0, 0],
            stroke,
            clear: false,
            clip,
            emphasis: readGpuEmphasis(
              node,
              mark.seriesId,
              mark.dataIndices,
              mark.dataAt,
            ),
          });
        }
      }
      flush();
      canvas.dataset.chartGpu = "ready";
      status?.remove();
      status = undefined;
    } catch {
      unavailable();
    }
  }
  const observer = new MutationObserver((records) => {
    if (
      records.some(
        ({ target }) =>
          target instanceof Element &&
          (target.hasAttribute("data-chart-gpu-mark") ||
            target.querySelector("[data-chart-gpu-mark]")),
      )
    ) {
      schedule();
    }
  });
  observer.observe(svg, { attributes: true, childList: true, subtree: true });
  const ancestors = new MutationObserver(schedule);
  for (let parent = svg.parentElement; parent; parent = parent.parentElement) {
    ancestors.observe(parent, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme"],
    });
  }
  const releaseEffects = subscribeGpuEffects(svg, schedule);
  window.addEventListener("resize", schedule);
  canvas.addEventListener("webglcontextrestored", schedule);
  return {
    register(node: SVGGraphicsElement, mark: GpuMark) {
      marks.set(node, mark);
      schedule();
      return () => {
        marks.delete(node);
        if (marks.size) {
          schedule();
        } else {
          queueMicrotask(() => {
            if (!marks.size) {
              this.dispose();
            }
          });
        }
      };
    },
    dispose() {
      if (disposed) {
        return;
      }
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      releaseEffects();
      ancestors.disconnect();
      window.removeEventListener("resize", schedule);
      canvas.removeEventListener("webglcontextrestored", schedule);
      points?.dispose();
      vector?.dispose();
      canvas
        .getContext("webgl2")
        ?.getExtension("WEBGL_lose_context")
        ?.loseContext();
      canvas.remove();
      status?.remove();
      scenes.delete(svg);
    },
  };
}
export function registerGpuMark(node: SVGGraphicsElement, mark: GpuMark) {
  const svg = node.ownerSVGElement;
  if (!svg || typeof WebGL2RenderingContext === "undefined") {
    return () => {};
  }
  let scene = scenes.get(svg);
  if (!scene) {
    scene = createScene(svg);
    scenes.set(svg, scene);
  }
  return scene.register(node, mark);
}
