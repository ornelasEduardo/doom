import type { PaintPlacement } from "./scene-layers";

const namespace = "http://www.w3.org/2000/svg";
const xlink = "http://www.w3.org/1999/xlink";
type Rect = { x: number; y: number; width: number; height: number };

/** Preserve native SVG bounds even when the GPU layer's parent is degenerate. */
export function createScenePresentation(
  svg: SVGSVGElement,
  placement: PaintPlacement,
) {
  const { canvas, layer, parent } = placement;
  const originalDisplay = layer.style.display;
  let revision = 0;
  let disposed = false;
  let definitions: SVGDefsElement | undefined;
  let helper: SVGPathElement | undefined;
  let filter: SVGFilterElement | undefined;
  let image: SVGFEImageElement | undefined;
  let pendingFrame:
    | { bounds: Rect; inverse: DOMMatrix; width: number; height: number }
    | undefined;

  function removeImagePresentation() {
    helper?.remove();
    definitions?.remove();
    helper = undefined;
    definitions = undefined;
    filter = undefined;
    image = undefined;
    layer.style.display = originalDisplay;
  }
  function ensureImagePresentation() {
    if (helper) {
      if (helper.nextSibling !== layer) {
        parent.insertBefore(helper, layer);
      }
      return;
    }
    const id = `chart-gpu-frame-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
    definitions = document.createElementNS(namespace, "defs");
    definitions.setAttribute("data-chart-gpu-presentation", "");
    filter = document.createElementNS(namespace, "filter");
    filter.id = id;
    filter.setAttribute("filterUnits", "userSpaceOnUse");
    filter.setAttribute("primitiveUnits", "userSpaceOnUse");
    filter.setAttribute("color-interpolation-filters", "sRGB");
    image = document.createElementNS(namespace, "feImage");
    image.setAttribute("preserveAspectRatio", "none");
    filter.append(image);
    definitions.append(filter);
    svg.append(definitions);
    helper = document.createElementNS(namespace, "path");
    helper.setAttribute("data-chart-gpu-presentation", "");
    helper.setAttribute("aria-hidden", "true");
    // A transparent stroke keeps the filter target renderable without changing
    // its geometric bounds or adding visible native SVG paint.
    helper.style.setProperty("fill", "none", "important");
    helper.style.setProperty("stroke", "transparent", "important");
    helper.style.setProperty("stroke-width", "1", "important");
    helper.style.setProperty("filter", `url("#${id}")`, "important");
    helper.style.pointerEvents = "none";
    parent.insertBefore(helper, layer);
  }

  return {
    update(
      box: Rect,
      matrix: DOMMatrix,
      width: number,
      height: number,
      isolate = false,
    ) {
      revision++;
      pendingFrame = undefined;
      if (disposed) {
        return;
      }
      const determinant = matrix.a * matrix.d - matrix.b * matrix.c;
      if (!Number.isFinite(determinant) || determinant === 0) {
        removeImagePresentation();
        layer.style.display = "none";
        return;
      }
      const inverse = matrix.inverse();
      if (
        ![
          inverse.a,
          inverse.b,
          inverse.c,
          inverse.d,
          inverse.e,
          inverse.f,
        ].every(Number.isFinite)
      ) {
        removeImagePresentation();
        layer.style.display = "none";
        return;
      }
      layer.setAttribute("x", String(box.x));
      layer.setAttribute("y", String(box.y));
      layer.setAttribute("width", String(box.width));
      layer.setAttribute("height", String(box.height));
      if (box.width > 0 && box.height > 0 && !isolate) {
        removeImagePresentation();
        canvas.style.transformOrigin = "0 0";
        canvas.style.transform = `matrix(${inverse.a}, ${inverse.b}, ${inverse.c}, ${inverse.d}, ${inverse.e - box.x}, ${inverse.f - box.y})`;
        return;
      }
      // SVG effects need an image source on engines that cannot rasterize a
      // live WebGPU foreignObject into their native SVG compositing passes.
      // The same presentation preserves zero-area native geometry bounds.
      layer.style.display = "none";
      ensureImagePresentation();
      helper!.setAttribute(
        "d",
        `M${box.x} ${box.y}L${box.x + box.width} ${box.y + box.height}`,
      );
      const corners = [
        [0, 0],
        [width, 0],
        [width, height],
        [0, height],
      ].map(([x, y]) => new DOMPoint(x, y).matrixTransform(inverse));
      const x = Math.min(...corners.map((point) => point.x));
      const y = Math.min(...corners.map((point) => point.y));
      const bounds = {
        x,
        y,
        width: Math.max(...corners.map((point) => point.x)) - x,
        height: Math.max(...corners.map((point) => point.y)) - y,
      };
      for (const [name, value] of Object.entries(bounds)) {
        filter!.setAttribute(name, String(value));
        image!.setAttribute(name, String(value));
      }
      pendingFrame = { bounds, inverse, width, height };
    },
    present(waitForGpu: () => Promise<void>) {
      const frame = pendingFrame;
      if (!frame || disposed) {
        return;
      }
      const version = ++revision;
      // Capture synchronously after submission, before the canvas texture can
      // expire. Only this rare presentation path reads back a GPU-rendered image.
      const png = canvas.toDataURL("image/png");
      const { bounds: b, inverse: m, width, height } = frame;
      const wrapper = `<svg xmlns="${namespace}" xmlns:xlink="${xlink}" width="${b.width}" height="${b.height}" viewBox="${b.x} ${b.y} ${b.width} ${b.height}"><image href="${png}" xlink:href="${png}" width="${width}" height="${height}" transform="matrix(${m.a} ${m.b} ${m.c} ${m.d} ${m.e} ${m.f})"/></svg>`;
      const uri = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(wrapper)}`;
      const decoded = new Image();
      decoded.src = uri;
      return Promise.all([waitForGpu(), decoded.decode()]).then(() => {
        if (disposed || version !== revision || !image) {
          return;
        }
        image.setAttribute("href", uri);
        // WebKit's SVG filter image implementation still needs XLink here.
        image.setAttributeNS(xlink, "xlink:href", uri);
      });
    },
    dispose() {
      disposed = true;
      revision++;
      pendingFrame = undefined;
      removeImagePresentation();
    },
  };
}
