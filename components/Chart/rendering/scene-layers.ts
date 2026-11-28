import type { GpuMark } from "./scene";

const namespace = "http://www.w3.org/2000/svg";
const generated = "[data-chart-gpu-layer], [data-chart-gpu-presentation]";
export interface PaintScene {
  register: (node: SVGGraphicsElement, mark: GpuMark) => () => void;
  dispose: () => void;
  invalidate: () => void;
}
export interface PaintPlacement {
  canvas: HTMLCanvasElement;
  parent: SVGGraphicsElement;
  layer: SVGForeignObjectElement;
  marks: () => ReadonlyMap<SVGGraphicsElement, GpuMark>;
}

/** SVG paint order is retained when native custom marks interleave GPU marks. */
export function createSceneLayers(
  svg: SVGSVGElement,
  createPaint: (placement?: PaintPlacement) => PaintScene,
  onDispose: () => void,
) {
  // Native SVG filters suppress semantic paint consistently in WebKit too;
  // CSS opacity() filters are ignored for some SVG shapes there.
  const definitions = document.createElementNS(namespace, "defs");
  const filter = document.createElementNS(namespace, "filter");
  const filterId = `chart-gpu-paint-${crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
  filter.id = filterId;
  const transfer = document.createElementNS(namespace, "feComponentTransfer");
  const alpha = document.createElementNS(namespace, "feFuncA");
  alpha.setAttribute("type", "linear");
  alpha.setAttribute("slope", "0");
  transfer.append(alpha);
  filter.append(transfer);
  definitions.append(filter);
  svg.append(definitions);
  const paintProperty = "--chart-gpu-paint-filter";
  const previousPaint = svg.style.getPropertyValue(paintProperty);
  const previousPriority = svg.style.getPropertyPriority(paintProperty);
  svg.style.setProperty(paintProperty, `url("#${filterId}")`);
  const marks = new Map<SVGGraphicsElement, GpuMark>();
  type Slot = {
    parent?: SVGGraphicsElement;
    nodes: SVGGraphicsElement[];
    paint: PaintScene;
    placement?: PaintPlacement;
    registrations: Map<
      SVGGraphicsElement,
      { mark: GpuMark; release: () => void }
    >;
  };
  let slots: Slot[] = [];
  let frame = 0;
  let disposed = false;
  function painted(node: Element) {
    if (
      node.matches(
        "[data-chart-gpu-mark], [data-chart-gpu-selector-proxy], [data-chart-cursor], [data-chart-hit-surface]",
      )
    ) {
      return false;
    }
    // Preserve potential native paint order even while CSS makes it invisible:
    // hover, transitions, and media queries do not necessarily mutate the DOM.
    // Axis labels and interaction decorations intentionally remain overlays.
    return (
      node.matches(
        "path, rect, circle, ellipse, line, polygon, polyline, text, image, use, foreignObject",
      ) && !node.closest('[data-doom-part="axes"], .chart-markers-layer')
    );
  }
  function release(slot: Slot) {
    slot.registrations.forEach(({ release }) => release());
    slot.paint.dispose();
    slot.placement?.layer.remove();
  }
  function reconcile() {
    frame = 0;
    if (disposed) {
      return;
    }
    const order: (SVGGraphicsElement | null)[] = [];
    function visit(element: Element) {
      if (
        element.matches("defs, clipPath, mask, marker, pattern, symbol") ||
        element.matches(generated)
      ) {
        return;
      }
      // Nested SVGs own their own paint scene and are one native paint item
      // relative to this SVG, even when their descendants are GPU marks.
      if (element !== svg && element instanceof SVGSVGElement) {
        order.push(null);
        return;
      }
      if (marks.has(element as SVGGraphicsElement)) {
        order.push(element as SVGGraphicsElement);
        return;
      }
      if (painted(element)) {
        order.push(null);
      }
      for (const child of element.children) {
        visit(child);
      }
    }
    visit(svg);
    const last = order.findLastIndex((item) => item !== null);
    // HTML canvases cannot paint as direct SVG children. Nested SVG viewports
    // need an in-SVG placement even when they contain only GPU marks.
    const mixed =
      svg.parentElement instanceof SVGElement ||
      order.slice(0, last).includes(null);
    const runs: { parent?: SVGGraphicsElement; nodes: SVGGraphicsElement[] }[] =
      [];
    if (!mixed) {
      runs.push({
        nodes: order.filter(
          (item): item is SVGGraphicsElement => item !== null,
        ),
      });
    } else {
      let previous: SVGGraphicsElement | null = null;
      for (const node of order) {
        if (!node) {
          previous = null;
          continue;
        }
        const parent = node.parentElement as unknown as SVGGraphicsElement;
        const run = runs.at(-1);
        if (previous && run?.parent === parent) {
          run.nodes.push(node);
        } else {
          runs.push({ parent, nodes: [node] });
        }
        previous = node;
      }
    }
    const old = [...slots];
    slots = runs
      .filter((run) => run.nodes.length)
      .map((run) => {
        const index = old.findIndex(
          (slot) =>
            slot.parent === run.parent &&
            (!run.parent ||
              slot.nodes.some((node) => run.nodes.includes(node))),
        );
        let slot = index < 0 ? undefined : old.splice(index, 1)[0];
        if (!slot) {
          let placement: PaintPlacement | undefined;
          if (run.parent) {
            const layer = document.createElementNS(namespace, "foreignObject");
            layer.setAttribute("data-chart-gpu-layer", "");
            layer.style.overflow = "visible";
            layer.style.pointerEvents = "none";
            const canvas = document.createElement("canvas");
            layer.append(canvas);
            run.parent.insertBefore(layer, run.nodes[0]);
            placement = {
              layer,
              canvas,
              parent: run.parent,
              marks: () => marks,
            };
          }
          slot = {
            ...run,
            placement,
            paint: createPaint(placement),
            registrations: new Map(),
          };
        }
        slot.nodes = run.nodes;
        if (
          slot.placement &&
          slot.placement.layer.nextElementSibling !== run.nodes[0]
        ) {
          run.parent!.insertBefore(slot.placement.layer, run.nodes[0]);
        }
        for (const [node, registration] of slot.registrations) {
          if (
            !run.nodes.includes(node) ||
            marks.get(node) !== registration.mark
          ) {
            registration.release();
            slot.registrations.delete(node);
          }
        }
        for (const node of run.nodes) {
          if (!slot.registrations.has(node)) {
            const mark = marks.get(node)!;
            slot.registrations.set(node, {
              mark,
              release: slot.paint.register(node, mark),
            });
          }
        }
        slot.paint.invalidate();
        return slot;
      });
    old.forEach(release);
  }
  function schedule() {
    if (!disposed && !frame) {
      frame = requestAnimationFrame(reconcile);
    }
  }
  const observer = new MutationObserver((records) => {
    if (
      records.some(({ target, addedNodes, removedNodes, type }) => {
        if (target instanceof Element && target.closest(generated)) {
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
        return true;
      })
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
  window.addEventListener("resize", schedule);
  return {
    register(node: SVGGraphicsElement, mark: GpuMark) {
      marks.set(node, mark);
      if (!slots.length) {
        reconcile();
      } else {
        schedule();
      }
      return () => {
        if (marks.get(node) !== mark) {
          return;
        }
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
      ancestors.disconnect();
      window.removeEventListener("resize", schedule);
      slots.forEach(release);
      slots = [];
      definitions.remove();
      if (previousPaint) {
        svg.style.setProperty(paintProperty, previousPaint, previousPriority);
      } else {
        svg.style.removeProperty(paintProperty);
      }
      onDispose();
    },
  };
}
