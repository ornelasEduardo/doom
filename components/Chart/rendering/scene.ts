import {
  clipBounds,
  type ClipPolygon,
  counterclockwise,
  intersectClip,
  rectangularClip,
} from "./clip-geometry";
import { createGpuPoints, type GpuPointSource } from "./gpu";
import { createGpuCompositor } from "./gpu-compositor";
import { readGpuEmphasis, subscribeGpuEffects } from "./gpu-effects";
import { createGpuVector, type VectorShape } from "./gpu-vector";
import styles from "./scene.module.scss";
import type { VectorContour } from "./vector-path";

export type GpuMark =
  | {
      kind: "path";
      contours: readonly VectorContour[];
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
  const pointSources = new WeakMap<GpuMark, GpuPointSource>();
  const colors = document.createElement("canvas").getContext("2d");
  let vector: ReturnType<typeof createGpuVector> | undefined;
  let points: ReturnType<typeof createGpuPoints> | undefined;
  let compositor: ReturnType<typeof createGpuCompositor> | undefined;
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
  let objectBounds = new WeakMap<SVGGraphicsElement, Rect>();
  function objectBoundsFor(element: SVGGraphicsElement): Rect {
    const cached = objectBounds.get(element);
    if (cached) {
      return cached;
    }
    const native = element.getBBox();
    let left = native.width || native.height ? native.x : Infinity;
    let top = native.width || native.height ? native.y : Infinity;
    let right =
      native.width || native.height ? native.x + native.width : -Infinity;
    let bottom =
      native.width || native.height ? native.y + native.height : -Infinity;
    const inverse = element.getScreenCTM()?.inverse();
    if (inverse) {
      // Dense clouds retain only a zero-radius SVG selector proxy. Reconstruct
      // their geometric bounds without creating per-row SVG elements.
      for (const [child, mark] of marks) {
        if (mark.kind !== "cloud" || !element.contains(child)) {
          continue;
        }
        const screen = child.getScreenCTM();
        if (!screen) {
          continue;
        }
        const matrix = inverse.multiply(screen);
        for (let i = 0; i < mark.radii.length; i++) {
          const x = mark.positions[i * 2],
            y = mark.positions[i * 2 + 1];
          const radius = mark.radii[i];
          if (
            !Number.isFinite(x) ||
            !Number.isFinite(y) ||
            !Number.isFinite(radius) ||
            radius < 0
          ) {
            continue;
          }
          const point = new DOMPoint(x, y).matrixTransform(matrix);
          const rx = radius * Math.hypot(matrix.a, matrix.c);
          const ry = radius * Math.hypot(matrix.b, matrix.d);
          left = Math.min(left, point.x - rx);
          right = Math.max(right, point.x + rx);
          top = Math.min(top, point.y - ry);
          bottom = Math.max(bottom, point.y + ry);
        }
      }
    }
    const box = Number.isFinite(left)
      ? { x: left, y: top, width: right - left, height: bottom - top }
      : { x: 0, y: 0, width: 0, height: 0 };
    objectBounds.set(element, box);
    return box;
  }
  function clipFor(node: SVGGraphicsElement): {
    clip?: Rect;
    clipPolygon?: ClipPolygon;
  } {
    let polygon: ClipPolygon | undefined;
    for (
      let element: Element | null = node;
      element;
      element = element.parentElement
    ) {
      const url = getComputedStyle(element).clipPath;
      const id = /#([^"')]+)/.exec(url)?.[1];
      const definition = id ? svg.ownerDocument.getElementById(id) : null;
      const rect = definition?.querySelector("rect");
      if (rect && element instanceof SVGGraphicsElement) {
        let matrix = matrixFor(element);
        if (matrix) {
          // Chromium/WebKit may expose legacy SVGMatrix objects whose multiply
          // rejects DOMMatrix; normalize before composing CSS transforms.
          matrix = new DOMMatrix([
            matrix.a,
            matrix.b,
            matrix.c,
            matrix.d,
            matrix.e,
            matrix.f,
          ]);
          const relative =
            definition?.getAttribute("clipPathUnits") === "objectBoundingBox";
          if (relative) {
            const box = objectBoundsFor(element);
            matrix = matrix
              .translate(box.x, box.y)
              .scale(box.width, box.height);
          }
          // Definition geometry has its own coordinate system, including both
          // clipPath and child transforms, independent of the clipped mark.
          const transforms: SVGGraphicsElement[] = [];
          for (
            let part: Element | null = rect;
            part;
            part = part.parentElement
          ) {
            transforms.unshift(part as SVGGraphicsElement);
            if (part === definition) {
              break;
            }
          }
          for (const part of transforms) {
            const style = getComputedStyle(part);
            let local = new DOMMatrix();
            if (style.transform && style.transform !== "none") {
              local = new DOMMatrix(style.transform);
            } else if (!part.style.transform) {
              // WebKit reports `none` for SVG transform attributes in defs.
              const list = part.transform?.baseVal;
              for (let i = 0; list && i < list.numberOfItems; i++) {
                local = local.multiply(list.getItem(i).matrix);
              }
            }
            const [x = 0, y = 0] = style.transformOrigin
              .split(/\s+/)
              .map((value) => Number.parseFloat(value) || 0);
            matrix = matrix.translate(x, y).multiply(local).translate(-x, -y);
          }
          const length = (value: SVGLength) =>
            relative && value.unitType === 2
              ? value.valueInSpecifiedUnits / 100
              : value.value;
          const x = length(rect.x.baseVal),
            y = length(rect.y.baseVal);
          const width = length(rect.width.baseVal),
            height = length(rect.height.baseVal);
          const projectedMatrix = matrix;
          const boundary =
            width <= 0 || height <= 0
              ? []
              : counterclockwise(
                  [
                    { x, y },
                    { x: x + width, y },
                    { x: x + width, y: y + height },
                    { x, y: y + height },
                  ].map((point) =>
                    new DOMPoint(point.x, point.y).matrixTransform(
                      projectedMatrix,
                    ),
                  ),
                );
          polygon =
            polygon === undefined ? boundary : intersectClip(polygon, boundary);
          if (!polygon.length) {
            break;
          }
        }
      }
      if (element === svg) {
        break;
      }
    }
    if (!polygon) {
      return {};
    }
    return {
      clip: clipBounds(polygon),
      clipPolygon: rectangularClip(polygon) ? undefined : polygon,
    };
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
      if (typeof WebGL2RenderingContext === "undefined") {
        unavailable();
        return;
      }
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
      compositor ??= createGpuCompositor(canvas.getContext("webgl2")!);
      compositor.begin(w, h);
      objectBounds = new WeakMap();
      const layers: {
        node: Element;
        opacity: number;
        target: WebGLFramebuffer;
      }[] = [];
      const target = () => layers.at(-1)?.target ?? null;
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
        opacity: number;
        pointTransform: [number, number, number, number];
        stroke?: { color: number[]; width: number };
        clip?: Rect;
        clipPolygon?: ClipPolygon;
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
            opacity: batch.opacity,
            pointTransform: batch.pointTransform,
            stroke: batch.stroke,
            radius: 6,
            clip: batch.clip,
            clipPolygon: batch.clipPolygon,
            clear: false,
            target: target(),
          },
        );
        batch = undefined;
      };
      const transition = (ancestry: { node: Element; opacity: number }[]) => {
        let common = 0;
        while (
          common < layers.length &&
          common < ancestry.length &&
          layers[common].node === ancestry[common].node
        ) {
          common++;
        }
        if (common === layers.length && common === ancestry.length) {
          return;
        }
        flush();
        while (layers.length > common) {
          const layer = layers.pop()!;
          compositor!.close(layers.length, layer.opacity, target());
        }
        for (let i = common; i < ancestry.length; i++) {
          layers.push({ ...ancestry[i], target: compositor!.open(i) });
        }
      };
      for (const [node, mark] of ordered) {
        const css = getComputedStyle(node),
          matrix = matrixFor(node);
        if (!matrix || css.display === "none" || css.visibility === "hidden") {
          continue;
        }
        const emphasis =
          mark.kind === "cloud"
            ? readGpuEmphasis(
                node,
                mark.seriesId,
                mark.dataIndices,
                mark.dataAt,
                Number(css.opacity),
              )
            : undefined;
        let hidden = false;
        const ancestry: { node: Element; opacity: number }[] = [];
        for (
          let ancestor: Element | null = node;
          ancestor;
          ancestor = ancestor.parentElement
        ) {
          const ancestorStyle = getComputedStyle(ancestor);
          if (ancestorStyle.display === "none") {
            hidden = true;
            break;
          }
          // Dense Dim overrides individual point opacity, including a zero
          // baseline; opacity on real ancestor groups still applies normally.
          const alpha =
            ancestor === node && emphasis ? 1 : Number(ancestorStyle.opacity);
          if (alpha === 0) {
            hidden = true;
            break;
          }
          // A cloud collapses individual semantic points, so its own opacity
          // remains per-point; actual SVG ancestors still isolate the group.
          if (alpha < 1 && !(ancestor === node && mark.kind !== "path")) {
            ancestry.unshift({ node: ancestor, opacity: alpha });
          }
          if (ancestor === svg) {
            break;
          }
        }
        if (hidden) {
          continue;
        }
        transition(ancestry);
        const opacity = mark.kind !== "path" ? Number(css.opacity) : 1;
        const fill = color(css.fill, Number(css.fillOpacity)),
          strokeColor = color(css.stroke, Number(css.strokeOpacity));
        const strokeWidth = Number.parseFloat(css.strokeWidth);
        const stroke =
          strokeColor && strokeWidth > 0
            ? {
                color: strokeColor,
                width: strokeWidth,
                dashArray:
                  css.strokeDasharray === "none"
                    ? []
                    : css.strokeDasharray
                        .split(/[ ,]+/)
                        .map((value) =>
                          value.endsWith("%")
                            ? (Number.parseFloat(value) *
                                Math.hypot(width, height)) /
                              Math.SQRT2 /
                              100
                            : Number.parseFloat(value),
                        ),
                dashOffset: css.strokeDashoffset.endsWith("%")
                  ? (Number.parseFloat(css.strokeDashoffset) *
                      Math.hypot(width, height)) /
                    Math.SQRT2 /
                    100
                  : Number.parseFloat(css.strokeDashoffset),
                lineCap: css.strokeLinecap as "butt" | "round" | "square",
                lineJoin: css.strokeLinejoin as "miter" | "round" | "bevel",
                miterLimit: Number.parseFloat(css.strokeMiterlimit),
              }
            : undefined;
        const { clip, clipPolygon } = clipFor(node);
        if (mark.kind === "point") {
          const pointTransform: [number, number, number, number] = [
            matrix.a,
            matrix.b,
            matrix.c,
            matrix.d,
          ];
          const key = JSON.stringify([
            fill,
            stroke,
            clip,
            clipPolygon,
            opacity,
            pointTransform,
          ]);
          if (batch?.key !== key) {
            flush();
            batch = {
              key,
              opacity,
              pointTransform,
              positions: [],
              radii: [],
              fill: fill ?? [0, 0, 0, 0],
              stroke,
              clip,
              clipPolygon,
            };
          }
          const p = new DOMPoint(mark.x, mark.y).matrixTransform(matrix);
          batch!.positions.push(p.x, p.y);
          batch!.radii.push(mark.radius);
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
            contours: mark.contours,
            transform: matrix,
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
          vector.draw([shape], {
            width,
            height,
            ratio,
            clip,
            clipPolygon,
            clear: false,
            target: target(),
          });
        } else {
          let source = pointSources.get(mark);
          if (!source) {
            source = {
              immutable: true,
              length: mark.positions.length / 2,
              buffers: () => ({ positions: mark.positions, radii: mark.radii }),
            };
            pointSources.set(mark, source);
          }
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
            radius: mark.radius,
            pointTransform: [matrix.a, matrix.b, matrix.c, matrix.d],
            color: fill ?? [0, 0, 0, 0],
            opacity: emphasis ? 1 : opacity,
            stroke,
            clear: false,
            target: target(),
            clip,
            clipPolygon,
            emphasis,
          });
        }
      }
      flush();
      transition([]);
      compositor.end();
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
        ({ target, removedNodes }) =>
          target instanceof Element &&
          (target.hasAttribute("data-chart-gpu-mark") ||
            target.querySelector("[data-chart-gpu-mark], clipPath") ||
            // Clip definitions affect marks outside their own DOM subtree.
            target.closest("defs, clipPath") ||
            Array.from(removedNodes).some(
              (node) =>
                node instanceof Element &&
                (node.matches("clipPath") || node.querySelector("clipPath")),
            )),
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
      compositor?.dispose();
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
  if (!svg) {
    return () => {};
  }
  let scene = scenes.get(svg);
  if (!scene) {
    scene = createScene(svg);
    scenes.set(svg, scene);
  }
  return scene.register(node, mark);
}
