import { Behavior, GenericBehavior } from "../types/events";
import {
  ChannelReference,
  HoverInteraction,
  InteractionChannel,
} from "../types/interaction";

type Mark = Element & { style: CSSStyleDeclaration; __data__?: unknown };
type OpacityDeclaration = { readonly value: string; readonly priority: string };
type OpacityOwnership = {
  baseline: OpacityDeclaration;
  applied: OpacityDeclaration;
  owners: Map<number, OpacityDeclaration>;
  style: string | null;
};

// Shared declaration ownership lets independent Dim instances detach in any
// order. Attach order determines priority; releasing and reacquiring a mark
// does not move an older behavior above a newer one.
const opacityOwnership = new WeakMap<Mark, OpacityOwnership>();
let nextOwner = 0;
const readOpacity = (mark: Mark): OpacityDeclaration => ({
  value: mark.style.getPropertyValue("opacity"),
  priority: mark.style.getPropertyPriority("opacity"),
});
const prepareOpacity = (mark: Mark): OpacityOwnership => {
  let ownership = opacityOwnership.get(mark);
  const style = mark.getAttribute("style");
  if (ownership && ownership.style === style) {
    return ownership;
  }
  const current = readOpacity(mark);
  if (!ownership) {
    ownership = {
      baseline: current,
      applied: current,
      owners: new Map(),
      style,
    };
    opacityOwnership.set(mark, ownership);
  } else {
    if (
      current.value !== ownership.applied.value ||
      current.priority !== ownership.applied.priority
    ) {
      ownership.baseline = current;
    }
    ownership.applied = current;
    ownership.style = style;
  }
  return ownership;
};
const applyOpacity = (mark: Mark, ownership: OpacityOwnership) => {
  const current = ownership.applied;
  let topOwner = -1;
  let desired = ownership.baseline;
  for (const [owner, value] of ownership.owners) {
    if (owner > topOwner) {
      topOwner = owner;
      desired = value;
    }
  }
  if (
    current.value !== desired.value ||
    current.priority !== desired.priority
  ) {
    if (desired.value) {
      mark.style.setProperty("opacity", desired.value, desired.priority);
    } else {
      mark.style.removeProperty("opacity");
    }
  }
  ownership.applied = desired;
  ownership.style = mark.getAttribute("style");
};

export interface DimOptions<T = unknown> {
  /**
   * The CSS selector for the elements that should be affected by dimming.
   * Typically matches series elements like bars, points, or lines.
   * @default ".chart-series-group, rect, circle, path"
   */
  selector?: string;

  /**
   * The opacity value to apply to *dimmed* (non-active) elements.
   * Active elements will retain their original opacity (usually 1).
   * @default 0.3
   */
  opacity?: number;

  /**
   * The interaction channel to listen to.
   * Defaults to `InteractionChannel.PRIMARY_HOVER`.
   */
  on?: ChannelReference<HoverInteraction<T>>;
}

/**
 * A behavior that creates a "focus" effect by dimming unrelated elements.
 *
 * When an element is hovered (or selected), this behavior reduces the opacity
 * of all other matching elements, drawing attention to the active data.
 *
 * @example
 * ```tsx
 * // Dim all bars except the one being hovered
 * Dim({ selector: ".chart-bar", opacity: 0.2 })
 * ```
 *
 * @param options - Configuration options for the dimming effect
 * @returns A Behavior function
 */
export function Dim(
  options?: Omit<DimOptions, "on"> & { on?: string },
): GenericBehavior;
export function Dim<T>(options: DimOptions<T>): Behavior<T>;
export function Dim<T = unknown>(options: DimOptions<T> = {}): Behavior<T> {
  const {
    selector = ".chart-series-group, rect, circle, path",
    opacity = 0.3,
    on = InteractionChannel.PRIMARY_HOVER,
  } = options;

  return ({ getChartContext, getInteraction }) => {
    const ctx = getChartContext();
    if (!ctx || !ctx.g) {
      return () => {};
    }

    const { g } = ctx;

    const root = g.node();
    if (!root) {
      return () => {};
    }

    const owner = ++nextOwner;
    let marks = new Set<Mark>();
    let byDatum = new Map<unknown, Set<Mark>>();
    let ancestors = new Set<Element>();
    const owned = new Set<Mark>();
    let active = new Set<Mark>();
    let dimming = false;
    let dirty = true;
    let disposed = false;
    let scheduled = false;
    let scene = ctx.chartStore.getState();
    // Normalize once, so writes can update the cache without reading each
    // mark's CSS declaration back on the first pointer frame.
    const declaration = root.ownerDocument.createElement("span").style;
    declaration.setProperty("opacity", String(opacity));
    const dimOpacity = declaration.getPropertyValue("opacity");
    const dimDeclaration = { value: dimOpacity, priority: "" };

    const restore = (mark: Mark) => {
      if (!owned.delete(mark)) {
        return;
      }
      const ownership = opacityOwnership.get(mark)!;
      ownership.owners.delete(owner);
      applyOpacity(mark, ownership);
    };
    const dim = (mark: Mark) => {
      if (!dimOpacity) {
        return;
      }
      const ownership = opacityOwnership.get(mark)!;
      owned.add(mark);
      ownership.owners.set(owner, dimDeclaration);
      applyOpacity(mark, ownership);
    };
    const observe = () =>
      observer.observe(root, {
        subtree: true,
        childList: true,
        attributes: true,
      });
    const invalidate = (records: MutationRecord[]) => {
      for (const record of records) {
        if (record.type === "attributes") {
          const element = record.target as Mark;
          // Another Dim's write is already reconciled by the shared owner
          // table. Observing it must not turn a target diff into a scene sweep.
          if (
            record.attributeName === "style" &&
            opacityOwnership.get(element)?.style ===
              element.getAttribute("style")
          ) {
            continue;
          }
          if (
            record.attributeName === "style" &&
            opacityOwnership.has(element)
          ) {
            applyOpacity(element, prepareOpacity(element));
          }
          // Overlay coordinates change on every hover; unrelated overlays must
          // not invalidate the mark index. Selector membership can change via
          // arbitrary attributes, including attributes on an ancestor.
          if (
            marks.has(element) ||
            ancestors.has(element) ||
            element.matches(selector) ||
            element.querySelector(selector)
          ) {
            dirty = true;
          }
        } else {
          const nodes = [...record.addedNodes, ...record.removedNodes];
          if (
            nodes.some(
              (node) =>
                node instanceof Element &&
                (marks.has(node as Mark) ||
                  ancestors.has(node) ||
                  node.matches(selector) ||
                  node.querySelector(selector)),
            )
          ) {
            dirty = true;
          }
        }
      }
    };
    const update = () => {
      if (disposed) {
        return;
      }
      invalidate(observer.takeRecords());
      const interaction =
        typeof on === "string" ? getInteraction(on) : getInteraction(on);
      const targets =
        interaction && "targets" in interaction ? interaction.targets : [];
      const next = new Set<Mark>();
      const hasActive = targets.length > 0;
      observer.disconnect();
      try {
        if (dirty) {
          const nextMarks = new Set(
            Array.from(root.querySelectorAll<Mark>(selector)).filter(
              (mark) => !!mark.style,
            ),
          );
          for (const mark of marks) {
            if (!nextMarks.has(mark)) {
              restore(mark);
            }
          }
          marks = nextMarks;
          byDatum = new Map();
          ancestors = new Set();
          for (const mark of marks) {
            prepareOpacity(mark);
            for (
              let parent: Element | null = mark.parentElement;
              parent && !ancestors.has(parent);
              parent = parent.parentElement
            ) {
              ancestors.add(parent);
              if (parent === root) {
                break;
              }
            }
            let group = byDatum.get(mark.__data__);
            if (!group) {
              byDatum.set(mark.__data__, (group = new Set()));
            }
            group.add(mark);
          }
        }
        for (const target of targets) {
          for (const mark of byDatum.get(target.data) ?? []) {
            next.add(mark);
          }
        }
        if (dirty || hasActive !== dimming) {
          for (const mark of marks) {
            if (hasActive && !next.has(mark)) {
              dim(mark);
            } else {
              restore(mark);
            }
          }
        } else if (hasActive) {
          for (const mark of active) {
            if (!next.has(mark)) {
              dim(mark);
            }
          }
          for (const mark of next) {
            if (!active.has(mark)) {
              restore(mark);
            }
          }
        }
        active = next;
        dimming = hasActive;
        dirty = false;
      } finally {
        observe();
      }
    };
    const observer = new MutationObserver((records) => {
      invalidate(records);
      if (dirty) {
        update();
      }
    });
    const unsubscribe = ctx.chartStore.subscribe(() => {
      const nextScene = ctx.chartStore.getState();
      if (
        scene.data !== nextScene.data ||
        scene.processedSeries !== nextScene.processedSeries ||
        scene.scales !== nextScene.scales ||
        scene.elements !== nextScene.elements
      ) {
        dirty = true;
        // Store subscribers can run before a renderer's datum-only join. Rebuild
        // once after the synchronous render work, even without DOM mutations.
        if (!scheduled) {
          scheduled = true;
          queueMicrotask(() => {
            scheduled = false;
            if (disposed) {
              return;
            }
            dirty = true;
            update();
          });
        }
      }
      scene = nextScene;
      update();
    });
    update();

    return () => {
      if (disposed) {
        return;
      }
      // Capture consumer declarations even when cleanup precedes observer delivery.
      invalidate(observer.takeRecords());
      disposed = true;
      unsubscribe();
      observer.disconnect();
      for (const mark of owned.keys()) {
        restore(mark);
      }
      marks.clear();
      byDatum.clear();
      ancestors.clear();
      active.clear();
    };
  };
}
