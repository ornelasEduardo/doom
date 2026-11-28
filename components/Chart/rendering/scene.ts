import "./scene.scss";

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
import { createSceneLayers, type PaintPlacement } from "./scene-layers";
import { createScenePresentation } from "./scene-presentation";
import type { VectorContour } from "./vector-path";
import { acquireWebGpuSurface, type GpuTarget } from "./webgpu-surface";

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
const scenes = new WeakMap<
  SVGSVGElement,
  ReturnType<typeof createSceneLayers>
>();

const unavailableScenes = new WeakMap<
  SVGSVGElement,
  {
    node: HTMLDivElement;
    canvases: Set<HTMLCanvasElement>;
  }
>();

function createPaintScene(svg: SVGSVGElement, placement?: PaintPlacement) {
  const canvas = placement?.canvas ?? document.createElement("canvas");
  canvas.className = styles.canvas;
  canvas.setAttribute("aria-hidden", "true");
  canvas.dataset.chartGpu = "preparing";
  if (!placement) {
    svg.parentElement?.insertBefore(canvas, svg);
  }
  const surface = acquireWebGpuSurface(canvas);
  const marks = new Map<SVGGraphicsElement, GpuMark>();
  const pointSources = new WeakMap<GpuMark, GpuPointSource>();
  const colors = document.createElement("canvas").getContext("2d");
  let vector: ReturnType<typeof createGpuVector> | undefined;
  let points: ReturnType<typeof createGpuPoints> | undefined;
  let compositor: ReturnType<typeof createGpuCompositor> | undefined;
  let frame = 0;
  let disposed = false;
  let presentationRevision = 0;
  const presentation = placement
    ? createScenePresentation(svg, placement)
    : undefined;
  let recoveryAttempted = false;
  const clearUnavailable = () => {
    const state = unavailableScenes.get(svg);
    if (!state) {
      return;
    }
    state.canvases.delete(canvas);
    if (!state.canvases.size) {
      state.node.remove();
      unavailableScenes.delete(svg);
    }
  };
  const unavailable = () => {
    canvas.dataset.chartGpu = "unavailable";
    let state = unavailableScenes.get(svg);
    if (!state) {
      const node = document.createElement("div");
      node.className = styles.status;
      node.setAttribute("role", "status");
      node.textContent =
        "GPU rendering is unavailable. Chart data remains accessible with the keyboard.";
      let host = svg.parentElement;
      while (host instanceof SVGElement) {
        host = host.parentElement;
      }
      host?.append(node);
      state = { node, canvases: new Set() };
      unavailableScenes.set(svg, state);
    }
    state.canvases.add(canvas);
  };
  function brightness(css: CSSStyleDeclaration) {
    // Built-in bar themes use brightness()/none. Read their independent paint
    // token because the semantic SVG's filter only suppresses duplicate paint.
    const match = /^brightness\(([^)]*)\)$/i.exec(
      css.getPropertyValue("--chart-gpu-color-filter").trim(),
    );
    const amount = match?.[1].trim();
    if (!amount) {
      return 1;
    }
    const value = amount.endsWith("%")
      ? Number(amount.slice(0, -1)) / 100
      : Number(amount);
    return Number.isFinite(value) && value >= 0 ? value : 1;
  }
  function color(value: string, opacity: number, lightness: number) {
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
    for (let channel = 0; channel < 3; channel++) {
      rgba[channel] = Math.min(1, rgba[channel] * lightness);
    }
    rgba[3] *= opacity;
    return rgba;
  }
  const schedule = () => {
    if (!disposed && !frame) {
      frame = requestAnimationFrame(draw);
    }
  };
  const externalSchedule = () => {
    recoveryAttempted = false;
    schedule();
  };
  const unsubscribeSurface = surface.subscribe(schedule);
  let viewport = new DOMMatrix();
  function viewportFor(width: number, height: number) {
    if (!svg.hasAttribute("viewBox")) {
      return new DOMMatrix();
    }
    const box = svg.viewBox.baseVal;
    if (!(box.width > 0 && box.height > 0)) {
      return null;
    }
    let sx = width / box.width;
    let sy = height / box.height;
    let x = 0;
    let y = 0;
    const aspect = svg.preserveAspectRatio.baseVal;
    if (aspect.align !== aspect.SVG_PRESERVEASPECTRATIO_NONE) {
      sx = sy =
        aspect.meetOrSlice === aspect.SVG_MEETORSLICE_SLICE
          ? Math.max(sx, sy)
          : Math.min(sx, sy);
      // Alignment constants enumerate the three X positions for each Y row.
      const alignment = aspect.align - aspect.SVG_PRESERVEASPECTRATIO_XMINYMIN;
      x = ((width - box.width * sx) * (alignment % 3)) / 2;
      y = ((height - box.height * sy) * Math.floor(alignment / 3)) / 2;
    }
    return new DOMMatrix([sx, 0, 0, sy, x - box.x * sx, y - box.y * sy]);
  }
  function matrixFor(node: SVGGraphicsElement) {
    const root = svg.getScreenCTM();
    const local = node.getScreenCTM();
    return root && local && root.a * root.d - root.b * root.c
      ? viewport.multiply(root.inverse()).multiply(local)
      : null;
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
    const screenMatrix = element.getScreenCTM();
    const inverse =
      screenMatrix &&
      screenMatrix.a * screenMatrix.d - screenMatrix.b * screenMatrix.c
        ? screenMatrix.inverse()
        : undefined;
    if (inverse) {
      // Dense clouds retain only a zero-radius SVG selector proxy. Reconstruct
      // their geometric bounds without creating per-row SVG elements.
      for (const [child, mark] of placement?.marks() ?? marks) {
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
      element && element !== placement?.parent;
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
    const revision = ++presentationRevision;
    const width = svg.width.baseVal.value,
      height = svg.height.baseVal.value;
    const mapping = width > 0 && height > 0 ? viewportFor(width, height) : null;
    if (!mapping) {
      // A zero-size viewBox disables native SVG paint, including a canvas
      // presented outside the SVG on the ordinary standalone fast path.
      canvas.style.visibility = "hidden";
      clearUnavailable();
      return;
    }
    viewport = mapping;
    canvas.style.visibility = "";
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
      objectBounds = new WeakMap();
      if (placement) {
        // Keep the foreignObject within the preexisting SVG geometry bounds;
        // full-canvas boxes would change objectBoundingBox clipping.
        const layers = Array.from(
          svg.querySelectorAll<SVGElement>(
            "[data-chart-gpu-layer], [data-chart-gpu-presentation]",
          ),
          (layer) => ({ layer, display: layer.style.display }),
        );
        layers.forEach(({ layer }) => {
          layer.style.display = "none";
        });
        let box: Rect;
        try {
          box = objectBoundsFor(placement.parent);
        } finally {
          layers.forEach(({ layer, display }) => {
            layer.style.display = display;
          });
        }
        const matrix = matrixFor(placement.parent);
        if (!matrix) {
          return;
        }
        // WebKit cannot reliably composite transformed live WebGPU canvases
        // inside SVG. Image presentation preserves the same affine coordinates.
        let isolate =
          svg.parentElement instanceof SVGElement ||
          matrix.a !== 1 ||
          matrix.b !== 0 ||
          matrix.c !== 0 ||
          matrix.d !== 1 ||
          matrix.e !== 0 ||
          matrix.f !== 0;
        for (
          let ancestor: Element | null = placement.parent;
          ancestor;
          ancestor = ancestor.parentElement
        ) {
          const css = getComputedStyle(ancestor);
          if (
            Number(css.opacity) < 1 ||
            [css.clipPath, css.maskImage, css.filter].some(
              (value) => value && value !== "none",
            )
          ) {
            isolate = true;
            break;
          }
          if (ancestor === svg) {
            break;
          }
        }
        presentation!.update(box, matrix, width, height, isolate);
      }
      if (!surface.available) {
        if (!surface.error) {
          canvas.dataset.chartGpu = "preparing";
          clearUnavailable();
          return;
        }
        if (!recoveryAttempted && surface.error) {
          recoveryAttempted = true;
          surface.recover();
        }
        unavailable();
        return;
      }
      recoveryAttempted = false;
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
      surface.beginFrame(w, h);
      vector.draw([], { width, height, ratio });
      compositor ??= createGpuCompositor(surface);
      compositor.begin(w, h);
      objectBounds = new WeakMap();
      const layers: {
        node: Element;
        opacity: number;
        target: GpuTarget;
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
      const flushPoints = () => {
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
      let vectorBatch:
        | {
            key: string;
            shapes: VectorShape[];
            clip?: Rect;
            clipPolygon?: ClipPolygon;
          }
        | undefined;
      const flushVectors = () => {
        if (!vectorBatch) {
          return;
        }
        vector!.draw(vectorBatch.shapes, {
          width,
          height,
          ratio,
          clip: vectorBatch.clip,
          clipPolygon: vectorBatch.clipPolygon,
          clear: false,
          target: target(),
        });
        vectorBatch = undefined;
      };
      const flush = () => {
        flushPoints();
        flushVectors();
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
          ancestor && ancestor !== placement?.parent;
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
        const lightness = brightness(css);
        const fill = color(css.fill, Number(css.fillOpacity), lightness),
          strokeColor = color(css.stroke, Number(css.strokeOpacity), lightness);
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
          flushVectors();
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
        flushPoints();
        if (mark.kind === "path") {
          let y0 = Infinity,
            y1 = -Infinity;
          for (const contour of mark.contours) {
            for (const p of contour.points) {
              y0 = Math.min(y0, p.y);
              y1 = Math.max(y1, p.y);
            }
          }
          const start = y0 + (y1 - y0) * 0.05;
          const end = y1 - (y1 - y0) * 0.05;
          const span = end - start;
          const determinant = matrix.a * matrix.d - matrix.b * matrix.c;
          // SVG object-bounds gradients live in the path's local coordinates.
          // Map canvas pixels back through the affine transform before fading.
          const axis: [number, number, number] =
            span && determinant
              ? [
                  -matrix.b / determinant / span,
                  matrix.a / determinant / span,
                  ((matrix.b * matrix.e - matrix.a * matrix.f) / determinant -
                    start) /
                    span,
                ]
              : [0, 0, 0];
          const shape: VectorShape = {
            contours: mark.contours,
            transform: matrix,
            fill: fill
              ? {
                  color: fill,
                  gradient: mark.gradient
                    ? {
                        ...mark.gradient,
                        y0: start,
                        y1: end,
                        axis,
                      }
                    : undefined,
                }
              : undefined,
            stroke,
          };
          const key = JSON.stringify([clip, clipPolygon]);
          if (vectorBatch?.key !== key) {
            flushVectors();
            vectorBatch = { key, shapes: [], clip, clipPolygon };
          }
          vectorBatch.shapes.push(shape);
        } else {
          flushVectors();
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
      surface.endFrame();
      const complete = () => {
        if (
          !disposed &&
          revision === presentationRevision &&
          surface.available
        ) {
          canvas.dataset.chartGpu = "ready";
          clearUnavailable();
        }
      };
      const pending = presentation?.present(() =>
        surface.device.queue.onSubmittedWorkDone(),
      );
      if (pending) {
        canvas.dataset.chartGpu = "preparing";
        void pending.then(complete, () => {
          if (!disposed && revision === presentationRevision) {
            unavailable();
          }
        });
      } else {
        complete();
      }
    } catch {
      surface.abortFrame();
      unavailable();
    }
  }
  const observer = new MutationObserver((records) => {
    if (
      records.some(({ target, removedNodes, addedNodes, type }) => {
        const generated =
          "[data-chart-gpu-layer], [data-chart-gpu-presentation]";
        if (!(target instanceof Element) || target.closest(generated)) {
          return false;
        }
        if (type === "childList") {
          const changed = [...addedNodes, ...removedNodes];
          if (
            changed.length &&
            changed.every(
              (node) => node instanceof Element && node.matches(generated),
            )
          ) {
            return false;
          }
        }
        return (
          target.hasAttribute("data-chart-gpu-mark") ||
          target.querySelector("[data-chart-gpu-mark], clipPath") ||
          // Clip definitions affect marks outside their own DOM subtree.
          target.closest("defs, clipPath") ||
          Array.from(removedNodes).some(
            (node) =>
              node instanceof Element &&
              (node.matches("clipPath") || node.querySelector("clipPath")),
          )
        );
      })
    ) {
      externalSchedule();
    }
  });
  observer.observe(svg, { attributes: true, childList: true, subtree: true });
  const ancestors = new MutationObserver(externalSchedule);
  for (let parent = svg.parentElement; parent; parent = parent.parentElement) {
    ancestors.observe(parent, {
      attributes: true,
      attributeFilter: ["class", "style", "data-theme"],
    });
  }
  const releaseEffects = subscribeGpuEffects(svg, externalSchedule);
  window.addEventListener("resize", externalSchedule);
  svg.addEventListener("pointerover", schedule);
  svg.addEventListener("pointerout", schedule);

  return {
    invalidate: externalSchedule,
    register(node: SVGGraphicsElement, mark: GpuMark) {
      marks.set(node, mark);
      externalSchedule();
      return () => {
        marks.delete(node);
        if (marks.size) {
          externalSchedule();
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
      window.removeEventListener("resize", externalSchedule);
      svg.removeEventListener("pointerover", schedule);
      svg.removeEventListener("pointerout", schedule);
      unsubscribeSurface();
      compositor?.dispose();
      points?.dispose();
      vector?.dispose();
      surface.release();
      presentation?.dispose();
      canvas.remove();
      clearUnavailable();
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
    scene = createSceneLayers(
      svg,
      (placement) => createPaintScene(svg, placement),
      () => scenes.delete(svg),
    );
    scenes.set(svg, scene);
  }
  return scene.register(node, mark);
}
